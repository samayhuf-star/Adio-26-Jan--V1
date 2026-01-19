import { useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { ErrorHandler } from '../utils/errorHandler';

interface ApiCallOptions {
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApiCall<T = any>() {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { success, error: showError } = useNotification();

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T | null> => {
    const {
      showSuccessNotification = false,
      showErrorNotification = true,
      successMessage = 'Operation completed successfully',
      errorMessage = 'An error occurred',
      onSuccess,
      onError,
    } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      
      setState(prev => ({ ...prev, loading: false, data: result }));
      
      if (showSuccessNotification) {
        success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      const errorMsg = err?.message || errorMessage;
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err 
      }));
      
      // Log error for debugging
      ErrorHandler.captureError(err, {
        component: 'useApiCall',
        action: 'API Call Failed',
      });
      
      if (showErrorNotification) {
        showError('Error', errorMsg);
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    }
  }, [success, showError]);

  return { ...state, execute };
}

