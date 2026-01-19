import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight, Sparkle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { notifications } from '../utils/notifications';

interface PaymentSuccessProps {
  planName: string;
  amount: string;
  onGoToDashboard: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  planName,
  amount,
  onGoToDashboard,
}) => {
  useEffect(() => {
    // Show success notification
    notifications.success('Payment successful!', {
      title: 'Welcome to Adiology!',
      description: `You've successfully subscribed to ${planName}. Start building your campaigns now!`,
    });
  }, [planName]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-slate-200 shadow-2xl bg-white backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg mb-3">
                <Sparkle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Adiology</h2>
              <p className="text-xs text-slate-500 -mt-0.5">~ Samay</p>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your subscription has been activated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Details */}
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Plan</span>
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                    {planName}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Amount Paid</span>
                  <span className="text-lg font-bold text-indigo-600">{amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Status</span>
                  <span className="text-sm font-semibold text-indigo-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">What's Next?</h3>
              <ul className="space-y-2 text-sm text-indigo-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Your subscription is now active</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Invoice has been sent to your email</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Start building your first campaign</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <Button
              onClick={onGoToDashboard}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white h-12 text-lg font-semibold"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-slate-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@adiology.com" className="text-indigo-600 hover:underline">
                support@adiology.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

