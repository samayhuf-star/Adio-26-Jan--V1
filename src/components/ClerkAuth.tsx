// DEPRECATED: This component is no longer used. PocketBase auth is handled via Auth.tsx
// Keeping for backwards compatibility but should be removed
import React from 'react';
import { useAuth } from '../../utils/authCompat';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface ClerkAuthProps {
  onBackToHome: () => void;
  mode?: 'sign-in' | 'sign-up';
}

export const ClerkAuth: React.FC<ClerkAuthProps> = ({ onBackToHome, mode = 'sign-in' }) => {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={onBackToHome}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center text-white/80">
          <p className="mb-4">This component is deprecated. Please use the Auth component for authentication.</p>
          <Button
            onClick={onBackToHome}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Go to Auth
          </Button>
        </div>
      </div>
      
      <div className="p-4 text-center text-white/50 text-sm">
        <p>&copy; 2024 Adiology. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ClerkAuth;
