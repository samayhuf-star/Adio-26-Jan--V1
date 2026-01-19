import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { Rocket, Zap, Target, ArrowRight } from 'lucide-react';

export const FirstCampaignStep: React.FC = () => {
  const { completeOnboarding, prevStep } = useOnboarding();

  const handleCreateCampaign = () => {
    // Complete onboarding and redirect to campaign builder
    completeOnboarding();
    // This would typically navigate to the campaign builder
    console.log('Redirecting to campaign builder');
  };

  const handleSkip = () => {
    // Complete onboarding and go to dashboard
    completeOnboarding();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Ready to Create Your First Campaign?
          </CardTitle>
          <CardDescription>
            Let's get you started with your first Google Ads campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer" onClick={handleCreateCampaign}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Campaign Builder 3.0</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Our most advanced campaign builder with AI-powered suggestions and optimization
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Start Building
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-lg hover:border-green-300 transition-colors cursor-pointer" onClick={handleCreateCampaign}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">1-Click Builder</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Quick and easy campaign creation with pre-built templates
                  </p>
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    Quick Start
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-lg hover:border-purple-300 transition-colors cursor-pointer" onClick={handleCreateCampaign}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Preset Campaigns</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose from industry-specific campaign templates
                  </p>
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    Browse Presets
                    <Target className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-3">
              Not ready to create a campaign yet? No problem!
            </p>
            <Button variant="outline" onClick={handleSkip}>
              Skip to Dashboard
            </Button>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <div className="text-sm text-gray-500">
              You can create campaigns anytime from the dashboard
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};