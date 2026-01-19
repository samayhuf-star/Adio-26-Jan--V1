import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface ErrorState {
  errors: ErrorReport[];
  isReporting: boolean;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  resolved: boolean;
}

type ErrorAction =
  | { type: 'ADD_ERROR'; payload: Omit<ErrorReport, 'id' | 'timestamp' | 'resolved'> }
  | { type: 'RESOLVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_REPORTING'; payload: boolean };

interface ErrorContextType {
  state: ErrorState;
  addError: (error: Omit<ErrorReport, 'id' | 'timestamp' | 'resolved'>) => void;
  resolveError: (id: string) => void;
  clearErrors: () => void;
  getUnresolvedErrors: () => ErrorReport[];
  getCriticalErrors: () => ErrorReport[];
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'ADD_ERROR':
      const newError: ErrorReport = {
        ...action.payload,
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      
      // Keep only last 100 errors to prevent memory issues
      const updatedErrors = [...state.errors, newError].slice(-100);
      
      return {
        ...state,
        errors: updatedErrors,
      };
      
    case 'RESOLVE_ERROR':
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload ? { ...error, resolved: true } : error
        ),
      };
      
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };
      
    case 'SET_REPORTING':
      return {
        ...state,
        isReporting: action.payload,
      };
      
    default:
      return state;
  }
};

const initialState: ErrorState = {
  errors: [],
  isReporting: false,
};

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  const addError = React.useCallback((error: Omit<ErrorReport, 'id' | 'timestamp' | 'resolved'>) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
    
    // Auto-resolve low severity errors after 30 seconds
    if (error.severity === 'low') {
      setTimeout(() => {
        dispatch({ type: 'RESOLVE_ERROR', payload: error.message });
      }, 30000);
    }
  }, []);

  const resolveError = React.useCallback((id: string) => {
    dispatch({ type: 'RESOLVE_ERROR', payload: id });
  }, []);

  const clearErrors = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const getUnresolvedErrors = React.useCallback(() => {
    return state.errors.filter(error => !error.resolved);
  }, [state.errors]);

  const getCriticalErrors = React.useCallback(() => {
    return state.errors.filter(error => error.severity === 'critical' && !error.resolved);
  }, [state.errors]);

  // Persist errors to localStorage for debugging
  React.useEffect(() => {
    try {
      const recentErrors = state.errors.slice(-20); // Keep only recent errors
      localStorage.setItem('error_context_reports', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to persist errors to localStorage:', e);
    }
  }, [state.errors]);

  // Load persisted errors on mount
  React.useEffect(() => {
    try {
      const persistedErrors = localStorage.getItem('error_context_reports');
      if (persistedErrors) {
        const errors = JSON.parse(persistedErrors);
        errors.forEach((error: ErrorReport) => {
          dispatch({ type: 'ADD_ERROR', payload: error });
        });
      }
    } catch (e) {
      console.error('Failed to load persisted errors:', e);
    }
  }, []);

  const value: ErrorContextType = {
    state,
    addError,
    resolveError,
    clearErrors,
    getUnresolvedErrors,
    getCriticalErrors,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useErrorContext = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

// Hook for easy error reporting
export const useErrorReporting = () => {
  const { addError } = useErrorContext();

  const reportError = React.useCallback((
    error: Error | string,
    severity: ErrorReport['severity'] = 'medium',
    context?: Record<string, any>
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    addError({
      message: errorMessage,
      stack: errorStack,
      severity,
      context,
    });
  }, [addError]);

  const reportCriticalError = React.useCallback((
    error: Error | string,
    context?: Record<string, any>
  ) => {
    reportError(error, 'critical', context);
  }, [reportError]);

  const reportWarning = React.useCallback((
    message: string,
    context?: Record<string, any>
  ) => {
    reportError(message, 'low', context);
  }, [reportError]);

  return {
    reportError,
    reportCriticalError,
    reportWarning,
  };
};

// Hook for monitoring component errors
export const useComponentErrorMonitor = (componentName: string) => {
  const { reportError } = useErrorReporting();

  return React.useCallback((error: Error, errorInfo?: any) => {
    reportError(error, 'high', {
      component: componentName,
      errorInfo,
      timestamp: new Date().toISOString(),
    });
  }, [reportError, componentName]);
};
