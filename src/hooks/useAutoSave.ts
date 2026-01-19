import { useEffect, useRef, useCallback } from 'react';
import { historyService } from '../utils/historyService';

interface UseAutoSaveOptions {
  type: string; // Type of content (campaign, keyword-planner, etc.)
  data: any; // Data to save
  name: string; // Name of the item
  enabled?: boolean; // Whether auto-save is enabled
  delay?: number; // Delay in milliseconds (default: 3000ms = 3 seconds)
  onSave?: (draftId: string) => void; // Callback when save completes
  onError?: (error: Error) => void; // Callback on error
}

/**
 * Auto-save hook that saves drafts to history
 * 
 * Usage:
 * ```
 * const { saveDraft, saveCompleted, currentDraftId } = useAutoSave({
 *   type: 'campaign',
 *   data: campaignData,
 *   name: campaignName,
 *   enabled: true,
 *   delay: 3000
 * });
 * ```
 */
export function useAutoSave({
  type,
  data,
  name,
  enabled = true,
  delay = 3000,
  onSave,
  onError
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Save as draft
  const saveDraft = useCallback(async () => {
    if (isSavingRef.current) return;
    
    try {
      isSavingRef.current = true;
      
      // Check if data has actually changed
      const dataString = JSON.stringify(data);
      if (dataString === lastSavedDataRef.current) {
        isSavingRef.current = false;
        return;
      }

      // Generate draft name with timestamp
      const draftName = name || `${type} Draft`;
      const timestampedName = `${draftName} (Draft - ${new Date().toLocaleString()})`;

      if (draftIdRef.current) {
        // Update existing draft (will create if not found)
        try {
          await historyService.update(draftIdRef.current, data, timestampedName);
        } catch (updateError: any) {
          // If update fails because item doesn't exist, create a new draft
          if (updateError?.message?.includes('Item not found') || updateError?.message?.includes('not found')) {
            console.log('Draft not found, creating new draft...');
            const id = await historyService.save(type, timestampedName, data, 'draft');
            draftIdRef.current = id;
          } else {
            throw updateError; // Re-throw unexpected errors
          }
        }
      } else {
        // Create new draft
        const id = await historyService.save(type, timestampedName, data, 'draft');
        draftIdRef.current = id;
      }

      lastSavedDataRef.current = dataString;
      
      if (onSave && draftIdRef.current) {
        onSave(draftIdRef.current);
      }

      console.log('✅ Auto-saved draft:', draftIdRef.current);
    } catch (error) {
      // Only log unexpected errors - "Item not found" is now handled gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('Item not found') && !errorMessage.includes('not found')) {
        console.error('❌ Auto-save failed:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      } else {
        // Silently handle "item not found" - it's been handled by creating a new draft
        console.log('ℹ️ Auto-save handled gracefully (item not found, created new)');
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [type, data, name, onSave, onError]);

  // Save as completed (removes draft status)
  const saveCompleted = useCallback(async () => {
    try {
      if (draftIdRef.current) {
        await historyService.markAsCompleted(draftIdRef.current);
        console.log('✅ Marked as completed:', draftIdRef.current);
      } else {
        // Save directly as completed
        const completedName = name || `${type}`;
        await historyService.save(type, completedName, data, 'completed');
        console.log('✅ Saved as completed');
      }
      
      // Reset draft ID
      draftIdRef.current = null;
      lastSavedDataRef.current = '';
    } catch (error) {
      console.error('❌ Failed to save as completed:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [type, data, name, onError]);

  // Clear the current draft (useful when user explicitly saves or exports)
  const clearDraft = useCallback(() => {
    draftIdRef.current = null;
    lastSavedDataRef.current = '';
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !data) return;

    // Check if data is meaningful (not empty)
    const hasData = data && Object.keys(data).length > 0;
    if (!hasData) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, saveDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveDraft, // Manually trigger draft save
    saveCompleted, // Mark current draft as completed
    clearDraft, // Clear current draft reference
    currentDraftId: draftIdRef.current, // Current draft ID
    isSaving: isSavingRef.current // Whether currently saving
  };
}

