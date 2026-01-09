import { useState, useCallback, useSyncExternalStore } from 'react';

const ONBOARDING_KEY = 'plobie_onboarding_completed';

interface UseOnboardingResult {
  showOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  isLoading: boolean;
}

// Subscribe to localStorage changes
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

// Get the current onboarding state from localStorage
function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  const completed = localStorage.getItem(ONBOARDING_KEY);
  return !completed;
}

// Server-side snapshot (always false since we can't access localStorage)
function getServerSnapshot(): boolean {
  return false;
}

export function useOnboarding(): UseOnboardingResult {
  // Use useSyncExternalStore for localStorage to avoid setState in useEffect
  const showOnboarding = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isLoading] = useState(false);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    // Trigger a re-render by dispatching a storage event
    window.dispatchEvent(new Event('storage'));
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    // Trigger a re-render
    window.dispatchEvent(new Event('storage'));
  }, []);

  return {
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoading,
  };
}
