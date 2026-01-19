import { useEffect, useRef, useCallback } from 'react';

// Hook for managing timeouts with automatic cleanup
export const useTimeout = () => {
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = globalThis.setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      callback();
    }, delay);
    
    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);

  const clearTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    globalThis.clearTimeout(timeoutId);
    timeoutRefs.current.delete(timeoutId);
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeoutId => {
      globalThis.clearTimeout(timeoutId);
    });
    timeoutRefs.current.clear();
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return { setTimeout, clearTimeout, clearAllTimeouts };
};

// Hook for managing intervals with automatic cleanup
export const useInterval = () => {
  const intervalRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const intervalId = globalThis.setInterval(callback, delay);
    intervalRefs.current.add(intervalId);
    return intervalId;
  }, []);

  const clearInterval = useCallback((intervalId: NodeJS.Timeout) => {
    globalThis.clearInterval(intervalId);
    intervalRefs.current.delete(intervalId);
  }, []);

  const clearAllIntervals = useCallback(() => {
    intervalRefs.current.forEach(intervalId => {
      globalThis.clearInterval(intervalId);
    });
    intervalRefs.current.clear();
  }, []);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return { setInterval, clearInterval, clearAllIntervals };
};

// Hook for managing event listeners with automatic cleanup
export const useEventListener = () => {
  const listenersRef = useRef<Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }>>([]);

  const addEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    listenersRef.current.push({ element, event, handler, options });
  }, []);

  const removeEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.removeEventListener(event, handler, options);
    listenersRef.current = listenersRef.current.filter(
      listener => !(
        listener.element === element &&
        listener.event === event &&
        listener.handler === handler
      )
    );
  }, []);

  const removeAllEventListeners = useCallback(() => {
    listenersRef.current.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    listenersRef.current = [];
  }, []);

  // Cleanup all event listeners on unmount
  useEffect(() => {
    return () => {
      removeAllEventListeners();
    };
  }, [removeAllEventListeners]);

  return { addEventListener, removeEventListener, removeAllEventListeners };
};

// Hook for managing subscriptions with automatic cleanup
export const useSubscription = () => {
  const subscriptionsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

  const addSubscription = useCallback((subscription: { unsubscribe: () => void }) => {
    subscriptionsRef.current.push(subscription);
    return subscription;
  }, []);

  const removeSubscription = useCallback((subscription: { unsubscribe: () => void }) => {
    const index = subscriptionsRef.current.indexOf(subscription);
    if (index > -1) {
      subscriptionsRef.current.splice(index, 1);
      subscription.unsubscribe();
    }
  }, []);

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    subscriptionsRef.current = [];
  }, []);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return { addSubscription, removeSubscription, unsubscribeAll };
};

// Combined cleanup hook that provides all cleanup utilities
export const useCleanup = () => {
  const timeout = useTimeout();
  const interval = useInterval();
  const eventListener = useEventListener();
  const subscription = useSubscription();

  const cleanupAll = useCallback(() => {
    timeout.clearAllTimeouts();
    interval.clearAllIntervals();
    eventListener.removeAllEventListeners();
    subscription.unsubscribeAll();
  }, [timeout, interval, eventListener, subscription]);

  return {
    timeout,
    interval,
    eventListener,
    subscription,
    cleanupAll,
  };
};
