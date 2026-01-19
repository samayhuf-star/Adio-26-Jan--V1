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
        <div className="w-full max-w-md">
          {mode === 'sign-in' ? (
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
                  headerTitle: "text-white",
                  headerSubtitle: "text-white/70",
                  socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20",
                  socialButtonsBlockButtonText: "text-white",
                  dividerLine: "bg-white/20",
                  dividerText: "text-white/50",
                  formFieldLabel: "text-white/80",
                  formFieldInput: "bg-white/10 border-white/20 text-white placeholder:text-white/40",
                  formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
                  footerActionLink: "text-indigo-400 hover:text-indigo-300",
                  identityPreviewText: "text-white",
                  identityPreviewEditButton: "text-indigo-400",
                  formFieldAction: "text-indigo-400",
                  alertText: "text-white",
                  formFieldSuccessText: "text-green-400",
                  formFieldErrorText: "text-red-400",
                }
              }}
              routing="hash"
              signUpUrl="#/sign-up"
              forceRedirectUrl={undefined}
              fallbackRedirectUrl={undefined}
            />
          ) : (
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
                  headerTitle: "text-white",
                  headerSubtitle: "text-white/70",
                  socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20",
                  socialButtonsBlockButtonText: "text-white",
                  dividerLine: "bg-white/20",
                  dividerText: "text-white/50",
                  formFieldLabel: "text-white/80",
                  formFieldInput: "bg-white/10 border-white/20 text-white placeholder:text-white/40",
                  formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
                  footerActionLink: "text-indigo-400 hover:text-indigo-300",
                  identityPreviewText: "text-white",
                  identityPreviewEditButton: "text-indigo-400",
                  formFieldAction: "text-indigo-400",
                  alertText: "text-white",
                  formFieldSuccessText: "text-green-400",
                  formFieldErrorText: "text-red-400",
                }
              }}
              routing="hash"
              signInUrl="#/sign-in"
              forceRedirectUrl={undefined}
              fallbackRedirectUrl={undefined}
            />
          )}
        </div>
      </div>
      
      <div className="p-4 text-center text-white/50 text-sm">
        <p>&copy; 2024 Adiology. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ClerkAuth;
