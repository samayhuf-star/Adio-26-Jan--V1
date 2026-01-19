import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { autoFillForm } from '../utils/autoFill';
import { notifications } from '../utils/notifications';

interface AutoFillButtonProps {
    onAutoFill?: () => void;
    className?: string;
}

const STORAGE_KEY = 'autofill_button_state';
const DEFAULT_STATE = { isOpen: true, isMinimized: false };

export const AutoFillButton: React.FC<AutoFillButtonProps> = ({ onAutoFill, className = '' }) => {
    const [isFilling, setIsFilling] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    // Load state from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                setIsOpen(state.isOpen !== false); // Default to true if not set
                setIsMinimized(state.isMinimized || false);
            } else {
                // On first load, open automatically
                setIsOpen(true);
                setIsMinimized(false);
            }
        } catch (error) {
            console.error('Error loading autofill button state:', error);
            setIsOpen(true);
            setIsMinimized(false);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ isOpen, isMinimized }));
        } catch (error) {
            console.error('Error saving autofill button state:', error);
        }
    }, [isOpen, isMinimized]);

    const handleAutoFill = () => {
        setIsFilling(true);
        try {
            // Call the utility function
            autoFillForm();
            
            // Call custom handler if provided
            if (onAutoFill) {
                onAutoFill();
            }
            
            notifications.success('Form auto-filled successfully!', {
                title: 'Auto Fill Complete',
                description: 'All form fields have been filled with random test data.'
            });
        } catch (error) {
            console.error('Auto-fill error:', error);
            notifications.error('Failed to auto-fill form', {
                title: 'Auto Fill Error',
                description: 'Some fields may not have been filled. Please try again.'
            });
        } finally {
            setIsFilling(false);
        }
    };

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) {
        // Show a small button to reopen
        return (
            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                size="sm"
                style={{ position: 'fixed', top: '180px', right: '24px', zIndex: 100 }}
                className={`bg-white/95 backdrop-blur-md border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 shadow-md hover:shadow-lg transition-all p-2 ${className}`}
                title="Show Auto Fill button"
            >
                <Sparkles className="w-4 h-4" />
            </Button>
        );
    }

    return (
        <div style={{ position: 'fixed', top: '180px', right: '24px', zIndex: 100 }} className={`transition-all ${className}`}>
            <div className="bg-white/95 backdrop-blur-md border border-indigo-300 rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden">
                {!isMinimized ? (
                    <>
                        <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-200">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-indigo-700">Auto Fill</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    onClick={handleMinimize}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-indigo-50"
                                    title="Minimize"
                                >
                                    <ChevronUp className="w-3 h-3 text-indigo-600" />
                                </Button>
                                <Button
                                    onClick={handleClose}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-red-50"
                                    title="Close"
                                >
                                    <X className="w-3 h-3 text-red-600" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-2">
                            <Button
                                onClick={handleAutoFill}
                                disabled={isFilling}
                                variant="outline"
                                size="sm"
                                className="w-full bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400"
                                title="Auto-fill all form fields with test data (Testing Tool)"
                            >
                                <Sparkles className={`w-4 h-4 mr-2 ${isFilling ? 'animate-spin' : ''}`} />
                                {isFilling ? 'Filling...' : 'Fill All Fields'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-between px-2 py-1.5">
                        <Button
                            onClick={handleAutoFill}
                            disabled={isFilling}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-indigo-700 hover:bg-indigo-50"
                            title="Auto-fill all form fields"
                        >
                            <Sparkles className={`w-3.5 h-3.5 ${isFilling ? 'animate-spin' : ''}`} />
                        </Button>
                        <div className="flex items-center gap-1">
                            <Button
                                onClick={handleMinimize}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-indigo-50"
                                title="Expand"
                            >
                                <ChevronDown className="w-3 h-3 text-indigo-600" />
                            </Button>
                            <Button
                                onClick={handleClose}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-50"
                                title="Close"
                            >
                                <X className="w-3 h-3 text-red-600" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

