import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { Bell, Mail, Smartphone, Globe } from 'lucide-react';

export const PreferencesStep: React.FC = () => {
  const { nextStep, prevStep } = useOnboarding();
  const [preferences, setPreferences] = React.useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyReports: true,
  });

  const handleNext = () => {
    // Save preferences to user profile
    // This would typically make an API call
    console.log('Saving preferences:', preferences);
    nextStep();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Set Your Preferences
          </CardTitle>
          <CardDescription>
            Customize your experience and notification settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive important updates via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked: boolean) =>
                  setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-green-600" />
                <div>
                  <Label htmlFor="push-notifications" className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Get instant notifications in your browser
                  </p>
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={preferences.pushNotifications}
                onCheckedChange={(checked: boolean) =>
                  setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <div>
                  <Label htmlFor="marketing-emails" className="text-sm font-medium">
                    Marketing Emails
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive tips, updates, and promotional content
                  </p>
                </div>
              </div>
              <Switch
                id="marketing-emails"
                checked={preferences.marketingEmails}
                onCheckedChange={(checked: boolean) =>
                  setPreferences(prev => ({ ...prev, marketingEmails: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-orange-600" />
                <div>
                  <Label htmlFor="weekly-reports" className="text-sm font-medium">
                    Weekly Reports
                  </Label>
                  <p className="text-xs text-gray-500">
                    Get weekly performance summaries
                  </p>
                </div>
              </div>
              <Switch
                id="weekly-reports"
                checked={preferences.weeklyReports}
                onCheckedChange={(checked: boolean) =>
                  setPreferences(prev => ({ ...prev, weeklyReports: checked }))
                }
              />
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};