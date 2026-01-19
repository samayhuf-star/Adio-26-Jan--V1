import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { ArrowRight, Play, SkipForward } from 'lucide-react';

export const TourStep: React.FC = () => {
  const { nextStep, prevStep, completeOnboarding } = useOnboarding();

  const handleStartTour = () => {
    // Start the interactive tour
    console.log('Starting interactive tour');
    nextStep();
  };

  const handleSkipTour = () => {
    // Skip tour and complete onboarding
    completeOnboarding();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Take a Quick Tour
          </CardTitle>
          <CardDescription>
            Let us show you around the platform to get you started quickly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border rounded-lg text-center hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Tour</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get a guided walkthrough of all the key features and tools
              </p>
              <Button onClick={handleStartTour} className="w-full bg-blue-600 hover:bg-blue-700">
                Start Tour
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="p-6 border rounded-lg text-center hover:border-gray-300 transition-colors">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SkipForward className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Skip for Now</h3>
              <p className="text-sm text-gray-600 mb-4">
                Jump straight to the dashboard and explore on your own
              </p>
              <Button onClick={handleSkipTour} variant="outline" className="w-full">
                Skip Tour
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What you'll learn:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• How to create your first campaign</li>
              <li>• Using the keyword planner and research tools</li>
              <li>• Managing your account settings</li>
              <li>• Accessing support and resources</li>
            </ul>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <div className="text-sm text-gray-500">
              You can always access the tour later from the help menu
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};