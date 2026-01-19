import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentAuthUser, getCurrentUserProfile } from '../utils/auth';
import { supabase } from '../utils/supabase/client';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

export interface OnboardingState {
  isFirstTime: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  showTour: boolean;
  tourStep: number;
  completed: boolean;
  skipped: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  markStepCompleted: (stepId: string) => void;
  startTour: () => void;
  nextTourStep: () => void;
  endTour: () => void;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Adiology',
    description: 'Let\'s get you started with your marketing automation journey',
    completed: false,
    required: true,
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Tell us about yourself and your business',
    completed: false,
    required: true,
  },
  {
    id: 'preferences',
    title: 'Set Your Preferences',
    description: 'Customize your experience',
    completed: false,
    required: false,
  },
  {
    id: 'tour',
    title: 'Take a Tour',
    description: 'Discover key features and capabilities',
    completed: false,
    required: false,
  },
  {
    id: 'first-campaign',
    title: 'Create Your First Campaign',
    description: 'Let\'s build your first marketing campaign together',
    completed: false,
    required: false,
  },
];

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    isFirstTime: false,
    currentStep: 0,
    steps: defaultSteps,
    showTour: false,
    tourStep: 0,
    completed: false,
    skipped: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentAuthUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check if user has completed onboarding
      const { data: onboardingData, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        setIsLoading(false);
        return;
      }

      // Check if user profile exists and is complete
      const profile = await getCurrentUserProfile();
      const isProfileComplete = profile && profile.full_name && profile.email;

      if (!onboardingData) {
        // First time user
        setState(prev => ({
          ...prev,
          isFirstTime: true,
          completed: false,
          skipped: false,
        }));
      } else {
        // Returning user
        const steps = [...defaultSteps];
        if (onboardingData.steps_completed) {
          onboardingData.steps_completed.forEach((stepId: string) => {
            const step = steps.find(s => s.id === stepId);
            if (step) step.completed = true;
          });
        }

        setState(prev => ({
          ...prev,
          isFirstTime: false,
          completed: onboardingData.completed || false,
          skipped: onboardingData.skipped || false,
          currentStep: onboardingData.current_step || 0,
          steps,
        }));
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOnboardingState = async (updates: Partial<OnboardingState>) => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;

      const completedSteps = updates.steps?.filter(s => s.completed).map(s => s.id) || 
                           state.steps.filter(s => s.completed).map(s => s.id);

      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          completed: updates.completed ?? state.completed,
          skipped: updates.skipped ?? state.skipped,
          current_step: updates.currentStep ?? state.currentStep,
          steps_completed: completedSteps,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving onboarding state:', error);
      }
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  const startOnboarding = () => {
    const newState = {
      ...state,
      isFirstTime: true,
      currentStep: 0,
      completed: false,
      skipped: false,
    };
    setState(newState);
    saveOnboardingState(newState);
  };

  const nextStep = () => {
    const nextStepIndex = Math.min(state.currentStep + 1, state.steps.length - 1);
    const newState = { ...state, currentStep: nextStepIndex };
    setState(newState);
    saveOnboardingState(newState);
  };

  const prevStep = () => {
    const prevStepIndex = Math.max(state.currentStep - 1, 0);
    const newState = { ...state, currentStep: prevStepIndex };
    setState(newState);
    saveOnboardingState(newState);
  };

  const skipOnboarding = () => {
    const newState = {
      ...state,
      skipped: true,
      completed: false,
      isFirstTime: false,
    };
    setState(newState);
    saveOnboardingState(newState);
  };

  const completeOnboarding = () => {
    const newState = {
      ...state,
      completed: true,
      isFirstTime: false,
      currentStep: state.steps.length - 1,
    };
    setState(newState);
    saveOnboardingState(newState);
  };

  const markStepCompleted = (stepId: string) => {
    const updatedSteps = state.steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );
    const newState = { ...state, steps: updatedSteps };
    setState(newState);
    saveOnboardingState(newState);
  };

  const startTour = () => {
    setState(prev => ({ ...prev, showTour: true, tourStep: 0 }));
  };

  const nextTourStep = () => {
    setState(prev => ({ ...prev, tourStep: prev.tourStep + 1 }));
  };

  const endTour = () => {
    setState(prev => ({ ...prev, showTour: false, tourStep: 0 }));
    markStepCompleted('tour');
  };

  const value: OnboardingContextType = {
    state,
    startOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    markStepCompleted,
    startTour,
    nextTourStep,
    endTour,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};