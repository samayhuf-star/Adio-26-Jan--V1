import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Mail, Users, Zap, Heart, Star, ChevronDown, ChevronRight,
  Clock, Target, TrendingUp, AlertTriangle, Gift
} from 'lucide-react';

interface SequenceEmail {
  id: string;
  name: string;
  subject: string;
  triggerType: string;
  triggerValue: string;
  dayOffset: number;
  description: string;
}

interface SequenceConfig {
  name: string;
  icon: any;
  color: string;
  emails: SequenceEmail[];
}

const sequenceMetadata: Record<string, { name: string; icon: any; color: string }> = {
  lead_nurturing: { name: 'Lead Nurturing', icon: Users, color: 'bg-blue-500' },
  onboarding: { name: 'Onboarding', icon: Zap, color: 'bg-green-500' },
  conversion: { name: 'Conversion', icon: Target, color: 'bg-purple-500' },
  churn_prevention: { name: 'Churn Prevention', icon: AlertTriangle, color: 'bg-orange-500' },
  advocacy: { name: 'Advocacy', icon: Star, color: 'bg-yellow-500' }
};

const allEmails: SequenceEmail[] = [
  { id: 'ln_01', name: 'Lead Magnet Delivery', subject: 'Your Free Google Ads Checklist is Here!', triggerType: 'event', triggerValue: 'lead_magnet_download', dayOffset: 0, description: 'Deliver free resource immediately after signup' },
  { id: 'ln_02', name: 'Educational Value #1', subject: '3 Mistakes Killing Your Google Ads ROI', triggerType: 'time_delay', triggerValue: '2 days', dayOffset: 2, description: 'Educational content about common PPC mistakes' },
  { id: 'ln_03', name: 'Case Study', subject: 'How Sarah Increased Conversions 340%', triggerType: 'time_delay', triggerValue: '4 days', dayOffset: 4, description: 'Success story with real numbers' },
  { id: 'ln_04', name: 'Pain Point Agitation', subject: 'Why 73% of Google Ads Campaigns Fail', triggerType: 'time_delay', triggerValue: '7 days', dayOffset: 7, description: 'Pain point agitation with statistics' },
  { id: 'ln_05', name: 'Soft CTA', subject: 'Ready to Build Your First Campaign?', triggerType: 'time_delay', triggerValue: '10 days', dayOffset: 10, description: 'Soft call to action to start free trial' },
  { id: 'ob_01', name: 'Welcome + Quick Win', subject: 'Welcome to Adiology! Your First Campaign in 5 Minutes', triggerType: 'event', triggerValue: 'user_signup', dayOffset: 0, description: 'Welcome email with quick win guide' },
  { id: 'ob_02', name: 'Feature Spotlight', subject: 'Unlock 500+ Keywords in 30 Seconds', triggerType: 'time_delay', triggerValue: '1 day', dayOffset: 1, description: 'Feature tutorial for AI keyword generation' },
  { id: 'ob_03', name: 'Progress Check', subject: "You're Making Great Progress!", triggerType: 'time_delay', triggerValue: '3 days', dayOffset: 3, description: 'Progress report with stats' },
  { id: 'ob_04', name: 'Power User Tip', subject: 'Advanced Feature: Competitor Ad Research', triggerType: 'time_delay', triggerValue: '5 days', dayOffset: 5, description: 'Advanced feature tutorial' },
  { id: 'ob_05', name: 'Social Proof', subject: 'See What Others Are Achieving', triggerType: 'time_delay', triggerValue: '7 days', dayOffset: 7, description: 'User testimonials and results' },
  { id: 'ob_06', name: 'Milestone Celebration', subject: "Incredible! You're a Campaign Building Pro", triggerType: 'time_delay', triggerValue: '10 days', dayOffset: 10, description: 'Milestone celebration with achievements' },
  { id: 'ob_07', name: 'Trial Warning', subject: "3 Days Left - Don't Lose Your Progress!", triggerType: 'time_delay', triggerValue: '11 days', dayOffset: 11, description: 'Trial ending warning with urgency' },
  { id: 'ob_08', name: 'Final Call', subject: 'FINAL DAY: Your Trial Expires Tomorrow', triggerType: 'time_delay', triggerValue: '13 days', dayOffset: 13, description: 'Last chance offer before trial ends' },
  { id: 'cv_01', name: 'Soft Nudge', subject: "Still Thinking? Here's What You'd Miss...", triggerType: 'event', triggerValue: 'trial_expired', dayOffset: 1, description: 'Soft nudge after trial expires' },
  { id: 'cv_02', name: 'Testimonial Push', subject: '"Best Decision I Made" - ROI Stories', triggerType: 'time_delay', triggerValue: '3 days after trial', dayOffset: 17, description: 'ROI-focused customer stories' },
  { id: 'cv_03', name: 'Objection Handler', subject: 'Common Questions Before Upgrading', triggerType: 'time_delay', triggerValue: '5 days after trial', dayOffset: 19, description: 'FAQ and pricing breakdown' },
  { id: 'cv_04', name: 'Urgency Final', subject: '48 Hours: Special Pricing Expires', triggerType: 'time_delay', triggerValue: '7 days after trial', dayOffset: 21, description: 'Limited-time discount offer' },
  { id: 'cv_05', name: 'Win-Back #1', subject: "We Miss You! Here's an Extended Trial", triggerType: 'time_delay', triggerValue: '14 days after trial', dayOffset: 28, description: 'Extended trial offer' },
  { id: 'cv_06', name: 'Win-Back #2', subject: 'Quick Question (Takes 30 Seconds)', triggerType: 'time_delay', triggerValue: '21 days after trial', dayOffset: 35, description: 'Exit survey to understand churn' },
  { id: 'cp_01', name: 'Save Offer', subject: 'Wait! Before You Go...', triggerType: 'event', triggerValue: 'cancel_intent', dayOffset: 0, description: 'Save offer when user tries to cancel' },
  { id: 'cp_02', name: 'Post-Cancel Feedback', subject: "We're Sorry to See You Go", triggerType: 'event', triggerValue: 'subscription_cancelled', dayOffset: 0, description: 'Feedback request after cancellation' },
  { id: 'cp_03', name: 'Comeback Offer', subject: "We've Missed You! Come Back for 40% Off", triggerType: 'time_delay', triggerValue: '60 days after cancel', dayOffset: 60, description: 'Major comeback offer for churned users' },
  { id: 'ad_01', name: 'Review Request', subject: 'Love Adiology? Share Your Experience!', triggerType: 'condition', triggerValue: 'active_30_days_high_usage', dayOffset: 30, description: 'Request review from happy customers' },
  { id: 'ad_02', name: 'Referral Program', subject: 'Give $20, Get $20 - Referral Program', triggerType: 'condition', triggerValue: 'active_90_days', dayOffset: 90, description: 'Referral program invitation' },
  { id: 'ad_03', name: 'Anniversary Reward', subject: 'Happy Anniversary! A Gift for You', triggerType: 'event', triggerValue: 'subscription_anniversary', dayOffset: 365, description: 'Anniversary celebration with loyalty reward' },
];

const getSequenceFromId = (id: string): string => {
  if (id.startsWith('ln_')) return 'lead_nurturing';
  if (id.startsWith('ob_')) return 'onboarding';
  if (id.startsWith('cv_')) return 'conversion';
  if (id.startsWith('cp_')) return 'churn_prevention';
  if (id.startsWith('ad_')) return 'advocacy';
  return 'unknown';
};

const buildSequenceData = (): Record<string, SequenceConfig> => {
  const result: Record<string, SequenceConfig> = {};
  
  for (const [key, meta] of Object.entries(sequenceMetadata)) {
    result[key] = {
      ...meta,
      emails: allEmails.filter(e => getSequenceFromId(e.id) === key)
    };
  }
  
  return result;
};

export function EmailFlows() {
  const [expandedSequences, setExpandedSequences] = useState<string[]>(['lead_nurturing', 'onboarding']);
  const sequenceData = useMemo(() => buildSequenceData(), []);

  const toggleSequence = (key: string) => {
    setExpandedSequences(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getTriggerBadge = (triggerType: string) => {
    switch (triggerType) {
      case 'event':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Event</Badge>;
      case 'time_delay':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Time Delay</Badge>;
      case 'condition':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Condition</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Flows</h2>
          <p className="text-gray-500">Complete email marketing sequences for lead nurturing, onboarding, conversion, and retention</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">{allEmails.length}</div>
            <div className="text-sm text-gray-500">Total Emails</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{Object.keys(sequenceMetadata).length}</div>
            <div className="text-sm text-gray-500">Sequences</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(sequenceData).map(([key, seq]) => {
          const Icon = seq.icon;
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleSequence(key)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${seq.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{seq.name}</div>
                  <div className="text-sm text-gray-500">{seq.emails.length} emails</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.entries(sequenceData).map(([key, seq]) => {
        const Icon = seq.icon;
        const isExpanded = expandedSequences.includes(key);

        return (
          <Card key={key} className="overflow-hidden">
            <CardHeader 
              className={`cursor-pointer ${seq.color} bg-opacity-10 hover:bg-opacity-20 transition-colors`}
              onClick={() => toggleSequence(key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${seq.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{seq.name} Sequence</CardTitle>
                    <p className="text-sm text-gray-500">{seq.emails.length} emails in this sequence</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{seq.emails.length} emails</Badge>
                  {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="p-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {seq.emails.map((email, index) => (
                      <div key={email.id} className="relative pl-10">
                        <div className={`absolute left-2 top-2 w-5 h-5 rounded-full ${seq.color} text-white flex items-center justify-center text-xs font-bold`}>
                          {index + 1}
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{email.name}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" /> {email.subject}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTriggerBadge(email.triggerType)}
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Day {email.dayOffset}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-2">{email.description}</p>
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Trigger: {email.triggerValue}
                            </span>
                          </div>
                        </div>
                        
                        {index < seq.emails.length - 1 && (
                          <div className="absolute left-4 top-full h-6 w-0.5 bg-gray-200 -translate-x-1/2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Flow Strategy</h3>
              <p className="text-sm text-gray-600 mt-1">
                This 25-email sequence covers the complete customer journey from lead capture to loyal advocate. 
                Emails are triggered by events (signup, trial expiry) or time delays after key milestones.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-lg font-bold text-blue-600">5</div>
              <div className="text-xs text-gray-500">Lead Nurturing</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-lg font-bold text-green-600">8</div>
              <div className="text-xs text-gray-500">Onboarding</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-lg font-bold text-purple-600">6</div>
              <div className="text-xs text-gray-500">Conversion</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-lg font-bold text-orange-600">3</div>
              <div className="text-xs text-gray-500">Churn Prevention</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-lg font-bold text-yellow-600">3</div>
              <div className="text-xs text-gray-500">Advocacy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailFlows;
