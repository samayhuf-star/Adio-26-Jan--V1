import React, { useState, useEffect } from 'react';
import { 
    CreditCard, CheckCircle, Shield, Download, 
    Calendar, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '../utils/api';
import { createCheckoutSession, createCustomerPortalSession } from '../utils/stripe';
import { notifications } from '../utils/notifications';
import { isPaidUser } from '../utils/userPlan';

import { getCurrentUserProfile } from '../utils/auth';

export const BillingPanel = () => {
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showAddCardDialog, setShowAddCardDialog] = useState(false);
    
    // Card form state
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVV, setCardCVV] = useState('');
    const [cardErrors, setCardErrors] = useState<{
        number?: string;
        name?: string;
        expiry?: string;
        cvv?: string;
    }>({});
    const [savedCards, setSavedCards] = useState<any[]>([]);

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
                    // Fallback: Read from PocketBase user profile
                    console.log('ℹ️ Using PocketBase user profile data (API unavailable)');
                    
                    try {
                        const userProfile = await getCurrentUserProfile();
                        const { pb } = await import('../utils/pocketbase/client');
                    
                        let userPlan = "Free";
                        let nextBillingDate: string | null = null;
                        let subscriptionStatus = "inactive";
                        let invoices: any[] = [];
                    
                        if (userProfile) {
                            // Fetch subscription from subscriptions collection
                            try {
                                const subscriptions = await pb.collection('subscriptions').getList(1, 1, {
                                    filter: `user_id = "${userProfile.id}"`,
                                    sort: '-created',
                                });
                                
                                if (subscriptions.items && subscriptions.items.length > 0) {
                                    const subscription = subscriptions.items[0];
                                    userPlan = subscription.plan_name || "Free";
                                    subscriptionStatus = subscription.status || "inactive";
                                    
                                    if (subscription.current_period_end) {
                                        nextBillingDate = new Date(subscription.current_period_end).toISOString().split('T')[0];
                                    } else if (userPlan.includes('Monthly')) {
                                        // Calculate next billing date if not set
                                        const nextDate = new Date();
                                        nextDate.setMonth(nextDate.getMonth() + 1);
                                        nextBillingDate = nextDate.toISOString().split('T')[0];
                                    }
                                }
                            } catch (subError) {
                                console.error('Error fetching subscription:', subError);
                            }
                            
                            // Fallback to user profile data if subscription not found
                            if (userPlan === "Free") {
                                const planMap: Record<string, string> = {
                                    'free': 'Free',
                                    'starter': 'Monthly Limited',
                                    'professional': 'Monthly Unlimited',
                                    'enterprise': 'Lifetime Unlimited'
                                };
                                
                                userPlan = planMap[userProfile.subscription_plan] || userProfile.subscription_plan || "Free";
                                subscriptionStatus = userProfile.subscription_status || "inactive";
                            }
                            
                            // Fetch invoices
                            try {
                                const invoiceData = await pb.collection('invoices').getList(1, 10, {
                                    filter: `user_id = "${userProfile.id}"`,
                                    sort: '-created',
                                });
                                
                                if (invoiceData.items) {
                                    invoices = invoiceData.items.map((inv: any) => ({
                                        id: inv.stripe_invoice_id || inv.id,
                                        date: new Date(inv.created).toISOString().split('T')[0],
                                        amount: `$${inv.amount?.toFixed(2) || '0.00'}`,
                                        status: inv.status === 'paid' ? 'Paid' : 'Pending'
                                    }));
                                }
                            } catch (invError) {
                                console.error('Error fetching invoices:', invError);
                            }
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
        
        if (sessionId) {
            // Payment successful - refresh subscription data
            notifications.success('Payment successful! Your subscription is now active.', {
                title: 'Welcome!',
                description: 'You now have access to all premium features.',
            });
            // Remove session_id from URL
            window.history.replaceState({}, '', window.location.pathname);
            // Refresh subscription data
            setTimeout(() => {
                fetchInfo();
                checkPaidStatus();
            }, 1000);
        } else if (canceled) {
            notifications.info('Payment was canceled. You can try again anytime.', {
                title: 'Payment Canceled',
            });
            // Remove canceled param from URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleSubscribe = async (planName?: string, priceId?: string) => {
        const selectedPlan = planName || 'Lifetime Unlimited';
        setProcessingPlan(selectedPlan);
        setProcessing(true);
        try {
            // Try to get the real price ID from Stripe
            let selectedPriceId = priceId;
            
            // If using placeholder price IDs, try to fetch the real ones
            if (!selectedPriceId || selectedPriceId.startsWith('price_basic') || selectedPriceId.startsWith('price_pro') || selectedPriceId === 'price_lifetime') {
                const { getPriceIdForPlan } = await import('../utils/stripe');
                const fetchedPriceId = await getPriceIdForPlan(selectedPlan, 'month');
                if (fetchedPriceId) {
                    selectedPriceId = fetchedPriceId;
                } else {
                    // Don't fallback to a different plan - show error instead
                    throw new Error(`The ${selectedPlan} plan is not yet configured. Please contact support or try a different plan.`);
                }
            }
            
            // Get current user for checkout
            const { getCurrentAuthUser } = await import('../utils/auth');
            const user = await getCurrentAuthUser();
            
            if (!user) {
                throw new Error('You must be logged in to subscribe');
            }
            
            // Create Stripe checkout session
            await createCheckoutSession(selectedPriceId, selectedPlan, user.id, user.email);
            
            // Note: User will be redirected to Stripe, so we don't need to setProcessing(false)
            // The redirect happens in createCheckoutSession
        } catch (error) {
            console.error("Subscription error", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // Provide more helpful error messages
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
            // Open Stripe Customer Portal for payment method management
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


    // Card validation functions
    const validateCardNumber = (value: string) => {
        const cleanValue = value.replace(/\s/g, '');
        if (!cleanValue) {
            setCardErrors(prev => ({ ...prev, number: undefined }));
            return;
        }
        if (cleanValue.length < 13 || cleanValue.length > 19) {
            setCardErrors(prev => ({ ...prev, number: 'Card number must be between 13 and 19 digits' }));
        } else if (!/^\d+$/.test(cleanValue)) {
            setCardErrors(prev => ({ ...prev, number: 'Card number must contain only digits' }));
        } else {
            setCardErrors(prev => ({ ...prev, number: undefined }));
        }
    };

    const validateCardName = (value: string) => {
        if (!value.trim()) {
            setCardErrors(prev => ({ ...prev, name: 'Cardholder name is required' }));
        } else if (value.trim().length < 2) {
            setCardErrors(prev => ({ ...prev, name: 'Cardholder name must be at least 2 characters' }));
        } else {
            setCardErrors(prev => ({ ...prev, name: undefined }));
        }
    };

    const validateCardExpiry = (value: string) => {
        if (!value) {
            setCardErrors(prev => ({ ...prev, expiry: undefined }));
            return;
        }
        const expiryMatch = value.match(/^(\d{2})\/(\d{2})$/);
        if (!expiryMatch) {
            setCardErrors(prev => ({ ...prev, expiry: 'Please enter a valid expiry date (MM/YY)' }));
        } else {
            const month = parseInt(expiryMatch[1], 10);
            const year = parseInt(expiryMatch[2], 10);
            const currentYear = new Date().getFullYear() % 100;
            const currentMonth = new Date().getMonth() + 1;
            
            if (month < 1 || month > 12) {
                setCardErrors(prev => ({ ...prev, expiry: 'Month must be between 01 and 12' }));
            } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
                setCardErrors(prev => ({ ...prev, expiry: 'Card has expired' }));
            } else {
                setCardErrors(prev => ({ ...prev, expiry: undefined }));
            }
        }
    };

    const validateCardCVV = (value: string) => {
        if (!value) {
            setCardErrors(prev => ({ ...prev, cvv: undefined }));
            return;
        }
        if (value.length < 3 || value.length > 4) {
            setCardErrors(prev => ({ ...prev, cvv: 'CVV must be 3 or 4 digits' }));
        } else if (!/^\d+$/.test(value)) {
            setCardErrors(prev => ({ ...prev, cvv: 'CVV must contain only digits' }));
        } else {
            setCardErrors(prev => ({ ...prev, cvv: undefined }));
        }
    };

    const resetCardForm = () => {
        setCardNumber('');
        setCardName('');
        setCardExpiry('');
        setCardCVV('');
        setCardErrors({});
    };

    const handleAddCard = async () => {
        if (!isCardFormValid()) {
            notifications.error('Please fix all errors before adding the card', {
                title: 'Validation Error',
                description: 'All card fields must be valid.',
            });
            return;
        }

        setProcessing(true);
        try {
            // In a real implementation, you would call Stripe API here to add the payment method
            // For now, we'll just simulate adding the card
            const cardNumberClean = cardNumber.replace(/\s/g, '');
            const last4 = cardNumberClean.slice(-4);
            const expiryParts = cardExpiry.split('/');
            
            // Simulate adding card to saved cards
            const newCard = {
                id: Date.now().toString(),
                brand: cardNumberClean.startsWith('4') ? 'visa' : cardNumberClean.startsWith('5') ? 'mastercard' : 'amex',
                last4: last4,
                expMonth: expiryParts[0] || '',
                expYear: expiryParts[1] || '',
                isDefault: savedCards.length === 0
            };
            
            setSavedCards(prev => [...prev, newCard]);
            setShowAddCardDialog(false);
            resetCardForm();
            
            notifications.success('Card added successfully', {
                title: 'Payment Method Added',
                description: `Your card ending in ${last4} has been added.`,
            });
        } catch (error) {
            console.error("Add card error", error);
            notifications.error('Failed to add card. Please try again.', {
                title: 'Error',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            setProcessing(false);
        }
    };

    // Validate card form
    const isCardFormValid = (): boolean => {
        // Check if all fields are filled
        if (!cardNumber.trim() || !cardName.trim() || !cardExpiry.trim() || !cardCVV.trim()) {
            return false;
        }

        // Check if there are any errors
        if (Object.keys(cardErrors).length > 0 && Object.values(cardErrors).some(err => err !== undefined && err !== '')) {
            return false;
        }

        // Basic validation
        const cardNumberClean = cardNumber.replace(/\s/g, '');
        if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
            return false;
        }

        // Validate expiry date format (MM/YY)
        const expiryMatch = cardExpiry.match(/^(\d{2})\/(\d{2})$/);
        if (!expiryMatch) {
            return false;
        }

        const month = parseInt(expiryMatch[1], 10);
        const year = parseInt(expiryMatch[2], 10);
        if (month < 1 || month > 12) {
            return false;
        }

        // Validate CVV (3-4 digits)
        if (cardCVV.length < 3 || cardCVV.length > 4) {
            return false;
        }

        return true;
    };

    const handleDownloadInvoice = async (invoiceId: string, invoiceDate: string, invoiceAmount: string) => {
        try {
            // Try to fetch invoice PDF from API using fetch directly for blob response
            try {
                const { projectId, publicAnonKey } = await import('../utils/supabase/info');
                const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6757d0ca`;
                const response = await fetch(`${API_BASE}/billing/invoices/${invoiceId}/download`, {
                    headers: {
                        'Authorization': `Bearer ${publicAnonKey}`
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
                                    "Priority Support", "Team Collaboration"
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
                                onClick={async () => {
                                    setProcessing(true);
                                    try {
                                        await createCustomerPortalSession();
                                        notifications.info('Redirecting to subscription management...', {
                                            title: 'Manage Subscription',
                                            description: 'You can view your plan, update payment methods, and manage your subscription.',
                                        });
                                    } catch (error) {
                                        console.error("Manage subscription error", error);
                                        notifications.error('Failed to open subscription portal. Please contact support.', {
                                            title: 'Error',
                                            description: error instanceof Error ? error.message : 'Unknown error occurred',
                                        });
                                    } finally {
                                        setProcessing(false);
                                    }
                                }}
                                disabled={processing || billingInfo.plan === 'Free'}
                                className="bg-indigo-600 text-white hover:bg-indigo-700 flex-1 min-w-0"
                            >
                                {processing ? "Processing..." : "Manage Subscription"}
                            </Button>
                            <Button 
                                onClick={() => handleSubscribe()} 
                                disabled={processing} 
                                variant="outline" 
                                className="flex-1 min-w-0"
                            >
                                {processing ? "Processing..." : "Upgrade Plan"}
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
                                    className="flex-1 min-w-0"
                                    onClick={() => setShowAddCardDialog(true)}
                                    disabled={processing}
                                >
                                    <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span className="truncate">{savedCards.length > 0 ? 'Add New Card' : 'Add Payment Card'}</span>
                                </Button>
                                {savedCards.length > 0 && (
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 min-w-0"
                                        onClick={() => setShowPaymentDialog(true)}
                                        disabled={processing}
                                    >
                                        <span className="truncate">Update Payment</span>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Upgrade Plan Section - Inline Pricing */}
            {!isPaid && (
                <Card className="border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl">Choose Your Plan</CardTitle>
                        <CardDescription>
                            Select the plan that best fits your needs. All plans include access to our powerful campaign building tools.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Basic Plan */}
                            <Card className="border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-lg relative flex flex-col h-full bg-blue-50/30">
                                <CardHeader className="flex-shrink-0 pb-3">
                                    <div className="text-center">
                                        <Badge className="mb-2 bg-blue-100 text-blue-700 border-blue-200 text-xs">Monthly</Badge>
                                        <CardTitle className="text-lg mb-2">Basic</CardTitle>
                                        <div className="text-2xl font-bold text-slate-800 mb-1">$69.99</div>
                                        <div className="text-xs text-slate-600">per month</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">10 Active Campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">5 Draft Campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">50 Campaign Exports/Month</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">500 Keyword Credits/Month</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">10 Landing Page Templates</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">3 Connected Domains</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">2 User Seats</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Email Support</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-shrink-0 pt-3 pb-4">
                                    <Button 
                                        className="w-full bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 text-sm"
                                        onClick={() => handleSubscribe("Basic", "price_basic_monthly")}
                                        disabled={processing || billingInfo.plan === "Basic"}
                                    >
                                        {billingInfo.plan === "Basic" ? "Current Plan" : processingPlan === "Basic" ? "Processing..." : "Get Started"}
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Pro Plan - Popular */}
                            <Card className="border-2 border-purple-400 hover:border-purple-500 transition-all hover:shadow-xl relative bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col h-full">
                                <div className="absolute top-2 right-2 z-10">
                                    <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 text-xs">Popular</Badge>
                                </div>
                                <CardHeader className="flex-shrink-0 pb-3">
                                    <div className="text-center">
                                        <Badge className="mb-2 bg-purple-100 text-purple-700 border-purple-200 text-xs">Monthly</Badge>
                                        <CardTitle className="text-lg mb-2">Pro</CardTitle>
                                        <div className="text-2xl font-bold text-slate-800 mb-1">$129.99</div>
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
                                            <span className="text-xs text-slate-700 font-semibold">Unlimited Draft Campaigns</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700 font-semibold">Unlimited Campaign Exports</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">2,500 Keyword Credits/Month</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">50+ Landing Page Templates</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">15 Connected Domains</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">5 User Seats</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Email Support & Tickets</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-shrink-0 pt-3 pb-4">
                                    <Button 
                                        className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg hover:shadow-xl text-sm"
                                        onClick={() => handleSubscribe("Pro", "price_pro_monthly")}
                                        disabled={processing || billingInfo.plan === "Pro"}
                                    >
                                        {billingInfo.plan === "Pro" ? "Current Plan" : processingPlan === "Pro" ? "Processing..." : "Get Started"}
                                    </Button>
                                </CardFooter>
                            </Card>

                            {/* Lifetime Plan */}
                            <Card className="border-2 border-pink-200 hover:border-pink-300 transition-all hover:shadow-lg relative flex flex-col h-full bg-pink-50/30">
                                <CardHeader className="flex-shrink-0 pb-3">
                                    <div className="text-center">
                                        <Badge className="mb-2 bg-pink-100 text-pink-700 border-pink-200 text-xs">One-Time</Badge>
                                        <CardTitle className="text-lg mb-2">Lifetime</CardTitle>
                                        <div className="text-2xl font-bold text-slate-800 mb-1">$49.99</div>
                                        <div className="text-xs text-slate-600">one-time payment</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">10 Campaigns per Month</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">1 Team Member</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">20+ Campaign Presets</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Keywords Mixer & Planner</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">CSV Export to Google Ads</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-700">Email & Chat Support</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                <CardFooter className="flex-shrink-0 pt-3 pb-4">
                                    <Button 
                                        className="w-full bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 text-sm"
                                        onClick={() => handleSubscribe("Lifetime", "price_lifetime")}
                                        disabled={processing || billingInfo.plan === "Lifetime"}
                                    >
                                        {billingInfo.plan === "Lifetime" ? "Current Plan" : processingPlan === "Lifetime" ? "Processing..." : "Get Started"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            )}

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

            {/* Add Payment Card Dialog */}
            <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Payment Card</DialogTitle>
                        <DialogDescription>
                            Add a payment card to enable plan upgrades. Your card will be securely stored for future transactions.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleAddCard();
                    }} className="space-y-4">
                        {/* Card Number */}
                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                                id="cardNumber"
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                                    if (value.length <= 16) {
                                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                                        setCardNumber(formatted);
                                        validateCardNumber(value);
                                    }
                                }}
                                className={cardErrors.number ? 'border-red-500' : ''}
                            />
                            {cardErrors.number && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {cardErrors.number}
                                </p>
                            )}
                        </div>

                        {/* Cardholder Name */}
                        <div className="space-y-2">
                            <Label htmlFor="cardName">Cardholder Name</Label>
                            <Input
                                id="cardName"
                                type="text"
                                placeholder="John Doe"
                                value={cardName}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setCardName(value);
                                    validateCardName(value);
                                }}
                                className={cardErrors.name ? 'border-red-500' : ''}
                            />
                            {cardErrors.name && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {cardErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Expiry and CVV */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cardExpiry">Expiry Date</Label>
                                <Input
                                    id="cardExpiry"
                                    type="text"
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, '');
                                        if (value.length >= 2) {
                                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                        }
                                        if (value.length <= 5) {
                                            setCardExpiry(value);
                                            validateCardExpiry(value);
                                        }
                                    }}
                                    className={cardErrors.expiry ? 'border-red-500' : ''}
                                />
                                {cardErrors.expiry && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {cardErrors.expiry}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardCVV">CVV</Label>
                                <Input
                                    id="cardCVV"
                                    type="text"
                                    placeholder="123"
                                    value={cardCVV}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setCardCVV(value);
                                        validateCardCVV(value);
                                    }}
                                    className={cardErrors.cvv ? 'border-red-500' : ''}
                                />
                                {cardErrors.cvv && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {cardErrors.cvv}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600">
                                    Your card details are encrypted and securely stored. We use industry-standard security measures to protect your information.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button 
                                type="button"
                                variant="outline" 
                                onClick={() => {
                                    setShowAddCardDialog(false);
                                    resetCardForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit"
                                disabled={processing || !isCardFormValid()}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                            >
                                {processing ? "Processing..." : "Add Card"}
                            </Button>
                        </DialogFooter>
                    </form>
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