/**
 * Ad History Manager
 * Manages undo/redo history for ad operations while maintaining CSV export compatibility
 */

export interface AdHistoryState {
    generatedAds: any[];
    selectedAdIds: number[];
    selectedPreviewAdId: number | null;
    timestamp: number;
}

export interface AdHistoryAction {
    type: 'create' | 'delete' | 'edit' | 'duplicate' | 'select';
    adId?: number;
    previousState: AdHistoryState;
    description: string;
}

class AdHistoryManager {
    private history: AdHistoryAction[] = [];
    private currentIndex: number = -1;
    private maxHistorySize: number = 50;

    /**
     * Save current state before an action
     */
    saveState(
        action: AdHistoryAction['type'],
        currentState: AdHistoryState,
        adId?: number,
        description?: string
    ): AdHistoryAction {
        const actionDescription = description || this.getDefaultDescription(action, adId);
        
        const historyAction: AdHistoryAction = {
            type: action,
            adId,
            previousState: {
                // Deep copy to maintain CSV export structure - preserves all ad properties needed for Google Ads Editor
                generatedAds: JSON.parse(JSON.stringify(currentState.generatedAds)),
                selectedAdIds: [...currentState.selectedAdIds],
                selectedPreviewAdId: currentState.selectedPreviewAdId,
                timestamp: Date.now(),
            },
            description: actionDescription,
        };

        // Remove any future history if we're in the middle of the history stack
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new action to history
        this.history.push(historyAction);
        this.currentIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        return historyAction;
    }

    /**
     * Get previous state for undo
     */
    undo(): AdHistoryState | null {
        if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
            return null;
        }

        const action = this.history[this.currentIndex];
        this.currentIndex--;

        return action.previousState;
    }

    /**
     * Get next state for redo
     */
    redo(): AdHistoryState | null {
        if (this.currentIndex >= this.history.length - 1) {
            return null;
        }

        this.currentIndex++;
        const action = this.history[this.currentIndex];

        // Return the state before the action (which is the state after the previous action)
        if (this.currentIndex + 1 < this.history.length) {
            return this.history[this.currentIndex + 1].previousState;
        }

        // If this is the last action, return the state after this action
        return null;
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.currentIndex >= 0 && this.currentIndex < this.history.length;
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Get description of last action
     */
    getLastActionDescription(): string | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex].description;
        }
        return null;
    }

    /**
     * Get description of next action (for redo)
     */
    getNextActionDescription(): string | null {
        if (this.currentIndex + 1 < this.history.length) {
            return this.history[this.currentIndex + 1].description;
        }
        return null;
    }

    /**
     * Clear history
     */
    clear(): void {
        this.history = [];
        this.currentIndex = -1;
    }

    /**
     * Get default description for action
     */
    private getDefaultDescription(action: AdHistoryAction['type'], adId?: number): string {
        switch (action) {
            case 'create':
                return `Created ad #${adId}`;
            case 'delete':
                return `Deleted ad #${adId}`;
            case 'edit':
                return `Edited ad #${adId}`;
            case 'duplicate':
                return `Duplicated ad #${adId}`;
            case 'select':
                return `Selected ad #${adId}`;
            default:
                return 'Modified ads';
        }
    }
}

export const adHistoryManager = new AdHistoryManager();

