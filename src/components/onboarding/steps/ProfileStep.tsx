import React, { useState, useEffect } from 'react';
import { User, Building, MapPin, Phone, Globe, Save } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { getCurrentUserProfile } from '../../../utils/auth';
import { supabase } from '../../../utils/supabase/client';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useNotification } from '../../../contexts/NotificationContext';

interface ProfileData {
  full_name: string;
  company_name: string;
  job_title: string;
  industry: string;
  company_size: string;
  phone: string;
  website: string;
  country: string;
  bio: string;
}

export const ProfileStep: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    company_name: '',
    job_title: '',
    industry: '',
    company_size: '',
    phone: '',
    website: '',
    country: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { markStepCompleted } = useOnboarding();
  const { success, error } = useNotification();

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          company_name: profile.company_name || '',
          job_title: profile.job_title || '',
          industry: profile.industry || '',
          company_size: profile.company_size || '',
          phone: profile.phone || '',
          website: profile.website || '',
          country: profile.country || '',
          bio: profile.bio || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!profileData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (profileData.website && !profileData.website.match(/^https?:\/\/.+/)) {
      errors.website = 'Please enter a valid URL (starting with http:// or https://)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        error('Unable to update profile', 'Please try again');
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name.trim(),
          company_name: profileData.company_name.trim() || null,
          job_title: profileData.job_title.trim() || null,
          industry: profileData.industry || null,
          company_size: profileData.company_size || null,
          phone: profileData.phone.trim() || null,
          website: profileData.website.trim() || null,
          country: profileData.country || null,
          bio: profileData.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      success('Profile updated successfully!');
      markStepCompleted('profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      error('Failed to update profile', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Real Estate',
    'Marketing & Advertising',
    'Consulting',
    'Non-profit',
    'Government',
    'Other'
  ];

  const companySizes = [
    'Just me',
    '2-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-1000 employees',
    '1000+ employees'
  ];

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Netherlands',
    'Sweden',
    'Other'
  ];

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Tell us about yourself
        </h3>
        <p className="text-gray-600">
          This helps us personalize your experience and provide better recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="full_name"
              value={profileData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter your full name"
              className={`mt-1 ${validationErrors.full_name ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {validationErrors.full_name && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.full_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="job_title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Building className="w-4 h-4" />
              Job Title
            </Label>
            <Input
              id="job_title"
              value={profileData.job_title}
              onChange={(e) => handleInputChange('job_title', e.target.value)}
              placeholder="e.g., Marketing Manager"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={profileData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4" />
              Country
            </Label>
            <Select value={profileData.country} onValueChange={(value: string) => handleInputChange('country', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="company_name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Building className="w-4 h-4" />
              Company Name
            </Label>
            <Input
              id="company_name"
              value={profileData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Enter your company name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
              Industry
            </Label>
            <Select value={profileData.industry} onValueChange={(value: string) => handleInputChange('industry', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="company_size" className="text-sm font-medium text-gray-700">
              Company Size
            </Label>
            <Select value={profileData.company_size} onValueChange={(value: string) => handleInputChange('company_size', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {companySizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Globe className="w-4 h-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={profileData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourcompany.com"
              className={`mt-1 ${validationErrors.website ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {validationErrors.website && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.website}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div>
        <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
          About You (Optional)
        </Label>
        <Textarea
          id="bio"
          value={profileData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us a bit about yourself and your goals..."
          rows={3}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          This helps us provide more personalized recommendations.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don't worry, you can always update this information later in your settings.
        </p>
      </div>
    </div>
  );
};