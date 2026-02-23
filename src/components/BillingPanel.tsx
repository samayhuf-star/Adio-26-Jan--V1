import React, { useState, useEffect, useRef } from 'react';
import { 
    CreditCard, CheckCircle, Download, 
    Calendar, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { api } from '../utils/api';
import { createCheckoutSession, createCustomerPortalSession } from '../utils/stripe';
import { notifications } from '../utils/notifications';
import { isPaidUser } from '../utils/userPlan';

import { getCurrentUserProfile, getCurrentAuthUser } from '../utils/auth';

export const BillingPanel = () => {
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const pricingSectionRef = useRef<HTMLDivElement>(null);
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [showLifetimeSuccess, setShowLifetimeSuccess] = useState(false);

    const fetchSavedCards = async () => {
        try {
            setLoadingCards(true);
            const user = await getCurrentAuthUser();
            if (!user?.email) return;
            const { getSessionToken } = await import('../utils/auth');
            const token = await getSessionToken();
            const response = await fetch(`/api/stripe/payment-methods/${encodeURIComponent(user.email)}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (response.ok) {
                const data = await response.json();
                setSavedCards(data.paymentMethods || []);
            }
        } catch (err) {
            console.error('Error fetching saved cards:', err);
        } finally {
            setLoadingCards(false);
        }
    };

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                setError(null);
                setLoading(true);
                try {
                    const data = await api.get('/billing/info');
                    setInfo(data);
                    setLoading(false);
                } catch (apiError) {
                    // Fallback: Read from user profile
                    console.log('ℹ️ Using user profile data (API unavailable)');
                    
                    try {
                        const userProfile = await getCurrentUserProfile();
                    
                        let userPlan = "Free";
                        let nextBillingDate: string | null = null;
                        let subscriptionStatus = "inactive";
                        let invoices: any[] = [];
                    
                        if (userProfile) {
                            // Use user profile data
                            const planMap: Record<string, string> = {
                                'free': 'Free',
                                'starter': 'Monthly Limited',
                                'professional': 'Monthly Unlimited',
                                'enterprise': 'Lifetime Unlimited',
                                'lifetime': 'Lifetime'
                            };
                            
                            userPlan = planMap[userProfile.subscription_plan || 'free'] || userProfile.subscription_plan || "Free";
                            subscriptionStatus = userProfile.subscription_status || "inactive";
                            
                            // Invoices will be fetched via API endpoint
                        }
                    
                        setInfo({
                            plan: userPlan,
                            nextBillingDate: nextBillingDate,
                            subscriptionStatus: subscriptionStatus,
                            invoices: invoices
                        });
                        setLoading(false);
                    } catch (profileError) {
                        console.error('Error loading user profile:', profileError);
                        // Bug_65: Set default info even on error to ensure component renders
                        setInfo({
                            plan: "Free",
                            nextBillingDate: null,
                            subscriptionStatus: "inactive",
                            invoices: []
                        });
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error("Billing error", error);
                setError(error instanceof Error ? error.message : "Failed to load billing info");
                // Bug_65: Set default info on error to ensure component renders
                setInfo({
                    plan: "Free",
                    nextBillingDate: null,
                    subscriptionStatus: "inactive",
                    invoices: []
                });
                setLoading(false);
            }
        };
        fetchInfo();
        fetchSavedCards();
        
        // Check if user is paid
        const checkPaidStatus = async () => {
            try {
                const paid = await isPaidUser();
                setIsPaid(paid);
            } catch (error) {
                console.error('Error checking paid status:', error);
                setIsPaid(false);
            }
        };
        checkPaidStatus();
        
        // Handle Stripe checkout return
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const canceled = urlParams.get('canceled');
        const lifetimeSuccess = urlParams.get('success');
        
        if (lifetimeSuccess === 'lifetime') {
            setShowLifetimeSuccess(true);
            notifications.success('Your Lifetime Access is now active! No more payments, ever.', {
                title: 'Welcome to the Lifetime Plan!',
                description: 'You now have permanent access to all Adiology features.',
            });
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => {
                fetchInfo();
                checkPaidStatus();
                fetchSavedCards();
            }, 1000);
        } else if (sessionId) {
            notifications.success('Payment successful! Your subscription is now active.', {
                title: 'Welcome!',
                description: 'You now have access to all premium features.',
            });
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => {
                fetchInfo();
                checkPaidStatus();
                fetchSavedCards();
            }, 1000);
        } else if (canceled) {
            notifications.info('Payment was canceled. You can try again anytime.', {
                title: 'Payment Canceled',
            });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleSubscribe = async (planName?: string, priceId?: string) => {
        const selectedPlan = planName || 'Lifetime Unlimited';
        await proceedWithSubscription(selectedPlan, priceId);
    };

    const proceedWithSubscription = async (planName: string, priceId?: string) => {
        setProcessingPlan(planName);
        setProcessing(true);
        try {
            let selectedPriceId = priceId || null;
            
            if (!selectedPriceId) {
                const { getPriceIdForPlan } = await import('../utils/stripe');
                selectedPriceId = await getPriceIdForPlan(planName, 'month');
            }
            
            if (!selectedPriceId) {
                throw new Error(`The ${planName} plan is not yet configured in Stripe. Please contact support or try a different plan.`);
            }
            
            const { getCurrentAuthUser } = await import('../utils/auth');
            const user = await getCurrentAuthUser();
            
            if (!user) {
                throw new Error('You must be logged in to subscribe');
            }
            
            await createCheckoutSession(selectedPriceId, planName, user.id, user.email);
        } catch (error) {
            console.error("Subscription error", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            if (errorMessage.includes('not yet configured') || errorMessage.includes('price') || errorMessage.includes('Price')) {
                notifications.error(errorMessage, {
                    title: 'Plan Unavailable',
                });
            } else {
                notifications.error('Failed to initiate checkout. Please try again.', {
                    title: 'Payment Error',
                    description: errorMessage,
                });
            }
            setProcessing(false);
            setProcessingPlan(null);
        }
    };

    const PLAN_TIERS = ['free', 'starter', 'professional', 'agency'];

    const getCurrentPlanTier = (): string => {
        const currentInfo = info || { plan: 'Free' };
        const plan = (currentInfo?.plan || 'Free').toLowerCase();
        const planMap: Record<string, string> = {
            'free': 'free',
            'monthly limited': 'starter',
            'starter': 'starter',
            'monthly unlimited': 'professional',
            'professional': 'professional',
            'pro': 'professional',
            'agency': 'agency',
            'enterprise': 'agency',
            'lifetime unlimited': 'lifetime',
            'lifetime': 'lifetime',
        };
        return planMap[plan] || 'free';
    };

    const getNextTier = (currentTier: string): string | null => {
        if (currentTier === 'lifetime') return null;
        const idx = PLAN_TIERS.indexOf(currentTier);
        if (idx === -1 || idx >= PLAN_TIERS.length - 1) return null;
        return PLAN_TIERS[idx + 1];
    };

    const getUpgradeButtonLabel = (): string => {
        const tier = getCurrentPlanTier();
        if (tier === 'lifetime' || tier === 'agency') return 'Top Plan';
        const next = getNextTier(tier);
        if (!next) return 'Upgrade Plan';
        const nameMap: Record<string, string> = { starter: 'Starter', professional: 'Professional', agency: 'Agency' };
        return `Upgrade to ${nameMap[next] || next}`;
    };

    const handleUpgradePlan = async () => {
        const currentTier = getCurrentPlanTier();

        if (currentTier === 'lifetime' || currentTier === 'agency') {
            notifications.info('You are already on the highest plan.', { title: 'Top Plan' });
            return;
        }

        if (currentTier === 'free') {
            pricingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const nextTier = getNextTier(currentTier);
        if (!nextTier) return;

        const nameMap: Record<string, string> = { starter: 'Starter', professional: 'Professional', agency: 'Agency' };
        const nextPlanName = nameMap[nextTier] || nextTier;

        setProcessingPlan('upgrade');
        setProcessing(true);
        try {
            const { getPriceIdForPlan } = await import('../utils/stripe');
            const newPriceId = await getPriceIdForPlan(nextPlanName, 'month');
            if (!newPriceId) {
                throw new Error(`The ${nextPlanName} plan is not configured in Stripe.`);
            }

            const { getCurrentAuthUser, getSessionToken } = await import('../utils/auth');
            const user = await getCurrentAuthUser();
            if (!user?.email) throw new Error('You must be logged in.');

            const token = await getSessionToken();
            const response = await fetch('/api/stripe/upgrade-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ email: user.email, newPriceId, newPlanName: nextPlanName }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error === 'NO_ACTIVE_SUBSCRIPTION') {
                    await handleSubscribe(nextPlanName, newPriceId);
                    return;
                }
                throw new Error(data.error || 'Upgrade failed');
            }

            notifications.success(`Successfully upgraded to ${nextPlanName}! Prorated charges have been applied.`, {
                title: 'Plan Upgraded',
            });

            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('Upgrade error:', error);
            notifications.error(error instanceof Error ? error.message : 'Upgrade failed. Please try again.', {
                title: 'Upgrade Error',
            });
        } finally {
            setProcessing(false);
            setProcessingPlan(null);
        }
    };

    const handleCancelSubscription = async () => {
        setProcessing(true);
        try {
            // Open Stripe Customer Portal for subscription cancellation
            await createCustomerPortalSession();
            setShowCancelDialog(false);
            notifications.info('Redirecting to subscription management...', {
                title: 'Subscription Management',
                description: 'You can cancel or modify your subscription in the portal.',
            });
        } catch (error) {
            console.error("Cancel subscription error", error);
            notifications.error('Failed to open subscription portal. Please contact support.', {
                title: 'Error',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdatePaymentMethod = async () => {
        setProcessing(true);
        try {
            await createCustomerPortalSession();
            setShowPaymentDialog(false);
        } catch (error) {
            console.error("Payment method update error", error);
            notifications.error('Failed to open payment portal. Please try again.', {
                title: 'Payment Portal Error',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
            setShowPaymentDialog(false);
        } finally {
            setProcessing(false);
        }
    };

    const handleAddCard = async () => {
        setProcessing(true);
        try {
            await createCustomerPortalSession();
        } catch (error) {
            console.error("Add card error", error);
            notifications.error('Failed to open payment portal. Please try again.', {
                title: 'Error',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadInvoice = async (invoiceId: string, invoiceDate: string, invoiceAmount: string) => {
        try {
            // Try to fetch invoice PDF from API using fetch directly for blob response
            try {
                // Use API endpoint instead of Supabase
                const { getSessionTokenSync } = await import('../utils/auth');
                const token = getSessionTokenSync();
                const response = await fetch(`/api/billing/invoices/${invoiceId}/download`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `invoice-${invoiceId}-${invoiceDate}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    return;
                }
            } catch (apiError) {
                // Fallback: Generate a simple invoice text file
                console.log('ℹ️ Using fallback invoice generation (API unavailable)');
            }
            
            // Fallback: Generate a simple invoice text file
            const invoiceContent = `INVOICE #${invoiceId}
Date: ${invoiceDate}
Amount: ${invoiceAmount}
Status: Paid

Thank you for your business!

---
Adiology Campaign Dashboard
Generated on ${new Date().toLocaleDateString()}`;
            
            const blob = new Blob([invoiceContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoiceId}-${invoiceDate}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download invoice", error);
            notifications.error('Failed to download invoice. Please try again.', {
                title: 'Download Failed'
            });
        }
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-slate-600">Loading billing information...</p>
                </div>
            </div>
        );
    }

    // Ensure we have info data (use default if null)
    const billingInfo = info || {
        plan: "Free",
        nextBillingDate: null,
        subscriptionStatus: "inactive",
        invoices: []
        };

    return (
        <div className="w-full space-y-10">
            {showLifetimeSuccess && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-emerald-900">Lifetime Access Activated!</h3>
                            <p className="text-emerald-700 mt-1">
                                Your one-time payment has been confirmed. You now have permanent access to all Adiology features — no subscriptions, no renewals, ever.
                            </p>
                            <p className="text-emerald-600 text-sm mt-2">
                                A confirmation email has been sent to your inbox with all the details.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowLifetimeSuccess(false)}
                            className="text-emerald-400 hover:text-emerald-600 transition-colors flex-shrink-0"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Current Plan */}
                <Card className="lg:col-span-2 border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg sm:text-xl">Current Plan</CardTitle>
                                <CardDescription className="mt-1">
                                    You are currently on the <span className="font-semibold text-indigo-600 break-words">{billingInfo.plan} Plan</span>
                                </CardDescription>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 self-start">Active</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xs sm:text-sm text-slate-500 mb-1">Next Billing Date</div>
                                <div className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                                    <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0"/> 
                                    <span className="break-words">
                                        {billingInfo.nextBillingDate 
                                            ? new Date(billingInfo.nextBillingDate).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric' 
                                              })
                                            : billingInfo.plan.includes('Lifetime') 
                                              ? 'Never (Lifetime)' 
                                              : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xs sm:text-sm text-slate-500 mb-1">Amount Due</div>
                                <div className="text-base sm:text-lg font-semibold text-slate-800">$0.00</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-3">Plan Features</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    "Unlimited Campaigns", "Advanced Keyword Planner", "CSV Export", 
                                    "Priority Support", "Click Guard Protection"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckCircle className="w-4 h-4 text-green-500" /> {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-6 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button 
                                onClick={handleUpgradePlan}
                                disabled={processing || getCurrentPlanTier() === 'agency' || getCurrentPlanTier() === 'lifetime'} 
                                className="bg-indigo-600 text-white hover:bg-indigo-700 flex-1 min-w-0"
                            >
                                {processingPlan === 'upgrade' ? "Upgrading..." : getUpgradeButtonLabel()}
                            </Button>
                        </div>
                        {billingInfo.plan !== 'Free' && !billingInfo.plan.includes('Lifetime') && (
                            <Button 
                                variant="link" 
                                className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                                onClick={() => setShowCancelDialog(true)}
                                disabled={processing}
                            >
                                Cancel Subscription
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Payment Method */}
                <div className="space-y-6">
                    <Card className="border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {savedCards.length > 0 ? (
                                <div className="space-y-3">
                                    {savedCards.map((card, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-slate-200 rounded-xl bg-white">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`w-10 h-6 rounded flex items-center justify-center text-white text-[8px] font-mono flex-shrink-0 ${
                                                    card.brand === 'visa' ? 'bg-slate-800' :
                                                    card.brand === 'mastercard' ? 'bg-red-600' :
                                                    card.brand === 'amex' ? 'bg-blue-600' :
                                                    'bg-slate-600'
                                                }`}>
                                                    {card.brand?.toUpperCase() || 'CARD'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium truncate">{card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card'} ending in {card.last4}</div>
                                                    <div className="text-xs text-slate-500">Expires {card.expMonth}/{card.expYear}</div>
                                                </div>
                                            </div>
                                            {card.isDefault && (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 self-start sm:self-center">Default</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm mb-4">No payment method added yet</p>
                                    <p className="text-xs text-slate-400">Add a card to enable upgrades</p>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 min-w-0 px-2 sm:px-4"
                                    onClick={handleAddCard}
                                    disabled={processing}
                                >
                                    <CreditCard className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                                    <span className="truncate text-xs sm:text-sm">{savedCards.length > 0 ? 'Manage Cards' : 'Add Card'}</span>
                                </Button>
                                {savedCards.length > 0 && (
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 min-w-0 px-2 sm:px-4"
                                        onClick={() => setShowPaymentDialog(true)}
                                        disabled={processing}
                                    >
                                        <span className="truncate text-xs sm:text-sm">Update</span>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Upgrade Plan Section - Inline Pricing */}
            <div ref={pricingSectionRef}>
                <Card className="border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl">Choose Your Plan</CardTitle>
                        <CardDescription>
                            Select the plan that best fits your needs. All plans include access to our powerful campaign building tools.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                            {/* Starter Plan */}
                            <Card className="border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-lg relative flex flex-col h-full bg-blue-50/30">
                                <CardHeader className="flex-shrink-0 pb-3">
                                    <div className="text-center">
                                        <Badge className="mb-2 bg-blue-100 text-blue-700 border-blue-200 text-xs">Monthly</Badge>
                                        <CardTitle className="text-lg mb-2">Starter</CardTitle>
                                        <div className="text-2xl font-bold text-slate-800 mb-1">$49</div>
                                        <div className="text-xs text-slate-600">per month</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">15 Active Campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Basic Analytics</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Email Support</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Keyword Planner & Mixer</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">CSV Export</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-shrink-0 pt-3 pb-4">
                                    <Button 
                                        className="w-full bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 text-sm"
                                        onClick={() => handleSubscribe("Starter")}
                                        disabled={processing || billingInfo.plan?.toLowerCase() === "starter"}
                                    >
                                        {billingInfo.plan?.toLowerCase() === "starter" ? "Current Plan" : processingPlan === "Starter" ? "Processing..." : "Get Started"}
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Professional Plan - Most Popular */}
                            <Card className="border-2 border-purple-400 hover:border-purple-500 transition-all hover:shadow-xl relative bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col h-full">
                                <div className="absolute top-2 right-2 z-10">
                                    <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 text-xs">Most Popular</Badge>
                                </div>
                                <CardHeader className="flex-shrink-0 pb-3">
                                    <div className="text-center">
                                        <Badge className="mb-2 bg-purple-100 text-purple-700 border-purple-200 text-xs">Monthly</Badge>
                                        <CardTitle className="text-lg mb-2">Professional</CardTitle>
                                        <div className="text-2xl font-bold text-slate-800 mb-1">$99</div>
                                        <div className="text-xs text-slate-600">per month</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700 font-semibold">50 Active Campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700 font-semibold">Advanced Analytics</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Priority Support</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Click Guard Protection</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Domain Monitoring</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">All Keyword Tools</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-shrink-0 pt-3 pb-4">
                                    <Button 
                                        className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg hover:shadow-xl text-sm"
                                        onClick={() => handleSubscribe("Professional")}
                                        disabled={processing || billingInfo.plan?.toLowerCase() === "professional"}
                                    >
                                        {billingInfo.plan?.toLowerCase() === "professional" ? "Current Plan" : processingPlan === "Professional" ? "Processing..." : "Get Started"}
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Agency Plan */}
                            <Card className="border-2 border-amber-300 hover:border-amber-400 transition-all hover:shadow-lg relative flex flex-col h-full bg-gradient-to-br from-amber-50 to-orange-50">
                                <CardHeader className="flex-shrink-0 pb-3">
                                    <div className="text-center">
                                        <Badge className="mb-2 bg-amber-100 text-amber-700 border-amber-200 text-xs">Monthly</Badge>
                                        <CardTitle className="text-lg mb-2">Agency</CardTitle>
                                        <div className="text-2xl font-bold text-slate-800 mb-1">$149</div>
                                        <div className="text-xs text-slate-600">per month</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700 font-semibold">Unlimited Campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700 font-semibold">Full Analytics Suite</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Dedicated Support</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">All Features Included</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">White Label Reports</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">API Access</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-shrink-0 pt-3 pb-4">
                                    <Button 
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl text-sm"
                                        onClick={() => handleSubscribe("Agency")}
                                        disabled={processing || billingInfo.plan?.toLowerCase() === "agency"}
                                    >
                                        {billingInfo.plan?.toLowerCase() === "agency" ? "Current Plan" : processingPlan === "Agency" ? "Processing..." : "Get Started"}
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Lifetime Plan */}
                            <Card className="border-2 border-emerald-400 hover:border-emerald-500 transition-all hover:shadow-xl relative bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col h-full">
                                <div className="absolute top-2 right-2 z-10">
                                    <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 text-xs">Limited Time</Badge>
                                </div>
                                <CardHeader className="flex-shrink-0 pb-3">
                                    <div className="text-center">
                                        <Badge className="mb-2 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">One-Time</Badge>
                                        <CardTitle className="text-lg mb-2">Lifetime</CardTitle>
                                        <div className="text-2xl font-bold text-slate-800 mb-1">$99</div>
                                        <div className="text-xs text-slate-600">one-time payment</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700 font-semibold">Unlimited Campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700 font-semibold">All Pro Features</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Priority Support</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">All Keyword Tools</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">No Recurring Fees</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Lifetime Updates</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-shrink-0 pt-3 pb-4">
                                    <Button 
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl text-sm"
                                        onClick={() => handleSubscribe("Lifetime")}
                                        disabled={processing || billingInfo.plan?.toLowerCase()?.includes("lifetime")}
                                    >
                                        {billingInfo.plan?.toLowerCase()?.includes("lifetime") ? "Current Plan" : processingPlan === "Lifetime" ? "Processing..." : "Get Lifetime Access"}
                                    </Button>
                                </CardFooter>
                            </Card>

                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices */}
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                    {billingInfo.invoices && billingInfo.invoices.length > 0 ? (
                        <div className="space-y-1">
                            {billingInfo.invoices.map((inv: any) => (
                                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-slate-50 rounded-lg transition-colors group">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 flex-shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-slate-800 text-sm sm:text-base">Invoice #{inv.id}</div>
                                            <div className="text-xs text-slate-500">{inv.date}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end">
                                        <span className="font-mono text-slate-600 text-sm sm:text-base">{inv.amount}</span>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">{inv.status}</Badge>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            onClick={() => handleDownloadInvoice(inv.id, inv.date, inv.amount)}
                                            title="Download Invoice"
                                        >
                                            <Download className="w-4 h-4 text-slate-400" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm mb-2">No invoices yet</p>
                            <p className="text-xs text-slate-400">Your invoice history will appear here</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cancel Subscription Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                            {billingInfo.plan.includes('Lifetime') 
                                ? "Are you sure you want to cancel your lifetime plan? This action cannot be undone."
                                : `Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period (${billingInfo.nextBillingDate ? new Date(billingInfo.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}).`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Keep Subscription
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleCancelSubscription}
                            disabled={processing}
                        >
                            {processing ? "Cancelling..." : "Yes, Cancel Subscription"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Payment Method Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Payment Method</DialogTitle>
                        <DialogDescription>
                            Update your payment method to continue your subscription without interruption.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {savedCards.length > 0 ? (
                            <div className="space-y-3">
                                {savedCards.map((card, idx) => (
                                    <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm font-medium">Payment Method {idx + 1}</div>
                                            {card.isDefault && (
                                                <Badge className="bg-green-100 text-green-700 border-green-200">Default</Badge>
                                            )}
                                        </div>
                            <div className="flex items-center gap-3">
                                            <div className={`w-10 h-6 rounded flex items-center justify-center text-white text-[8px] font-mono ${
                                                card.brand === 'visa' ? 'bg-slate-800' :
                                                card.brand === 'mastercard' ? 'bg-red-600' :
                                                card.brand === 'amex' ? 'bg-blue-600' :
                                                'bg-slate-600'
                                            }`}>
                                                {card.brand?.toUpperCase() || 'CARD'}
                                            </div>
                                <div>
                                                <div className="text-sm font-medium">{card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card'} ending in {card.last4}</div>
                                                <div className="text-xs text-slate-500">Expires {card.expMonth}/{card.expYear}</div>
                                            </div>
                                        </div>
                                </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                <div className="text-sm font-medium mb-2">No Payment Methods</div>
                                <div className="text-xs text-slate-500">Add a payment card to enable plan upgrades.</div>
                        </div>
                        )}
                        <div className="text-sm text-slate-600">
                            Clicking "Update Payment Method" will redirect you to our secure payment processor to add or update your payment information.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdatePaymentMethod}
                            disabled={processing}
                            className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                            {processing ? "Processing..." : "Update Payment Method"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};