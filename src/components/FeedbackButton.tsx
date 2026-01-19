import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, MessageCircleHeart, Camera, Upload, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { notifications } from '../utils/notifications';
import { submitFeedback } from '../utils/feedbackService';
// Dynamic import to avoid build-time resolution issues
const html2canvas = () => import('html2canvas').then(m => m.default);

// html2canvas is used instead of a manual canvas-based screenshot approach to
// improve screenshot fidelity and cross-browser reliability when capturing
// complex UI state. Be aware of the following limitations imposed by browser
// security and html2canvas itself:
// - Cross-origin images, videos, iframes, and fonts without appropriate CORS
//   headers may be omitted or can taint the canvas and cause capture to fail.
// - External or third-party embedded content (e.g. widgets, iframes) may
//   render as blank or differently than on screen.
// - Very large viewports can be slow to capture and increase memory usage.
// As a result, captured screenshots may occasionally differ slightly from the
// user-visible page in these edge cases.
interface FeedbackButtonProps {
  variant?: 'floating' | 'sidebar';
  sidebarOpen?: boolean;
  sidebarHovered?: boolean;
  currentPage?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  variant = 'floating',
  sidebarOpen = true,
  sidebarHovered = false,
  currentPage = 'Unknown'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'feature_request' | 'bug_report'>('feedback');
  const [rating, setRating] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoScreenshot, setAutoScreenshot] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capture screenshot when dialog opens
  useEffect(() => {
    if (isOpen && !autoScreenshot) {
      captureScreenshot();
    }
  }, [isOpen]);

  const [screenshotError, setScreenshotError] = useState(false);

  const captureScreenshot = async () => {
    setIsCapturingScreenshot(true);
    setScreenshotError(false);
    try {
      const mainContent = document.querySelector('main') || document.body;
      
      const html2canvasLib = await html2canvas();
      const canvas = await html2canvasLib(mainContent as HTMLElement, {
        backgroundColor: '#f8fafc',
        scale: 0.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.closest('[role="dialog"]') !== null;
        }
      });
      
      const screenshot = canvas.toDataURL('image/png', 0.8);
      setAutoScreenshot(screenshot);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      setScreenshotError(true);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxImages = 5;
    const currentCount = uploadedImages.length;
    const remainingSlots = maxImages - currentCount;

    if (remainingSlots <= 0) {
      notifications.warning('Maximum 5 images allowed', { title: 'Limit Reached' });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        notifications.error('Only image files are allowed', { title: 'Invalid File' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        notifications.error('Image size must be less than 5MB', { title: 'File Too Large' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAutoScreenshot = () => {
    setAutoScreenshot(null);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      notifications.error('Please enter your feedback or feature request', { title: 'Required Field' });
      return;
    }

    if (feedbackType === 'feedback' && !rating) {
      notifications.error('Please select a rating', { title: 'Required Field' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine all images
      const allImages: string[] = [];
      if (autoScreenshot) {
        allImages.push(autoScreenshot);
      }
      allImages.push(...uploadedImages);

      await submitFeedback({
        type: feedbackType,
        rating: feedbackType === 'feedback' ? parseInt(rating) : undefined,
        message: message.trim(),
        screenshots: allImages,
        pageUrl: window.location.href,
        pageName: currentPage,
        browserInfo: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      });

      notifications.success(
        feedbackType === 'feedback' 
          ? 'Thank you for your feedback!' 
          : feedbackType === 'bug_report'
          ? 'Bug report submitted successfully!'
          : 'Thank you for your feature request!',
        { title: 'Submitted Successfully' }
      );

      // Reset form
      setMessage('');
      setRating('');
      setFeedbackType('feedback');
      setAutoScreenshot(null);
      setUploadedImages([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      notifications.error('Failed to submit feedback. Please try again.', { title: 'Error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedbackDialog = () => (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      setIsOpen(open);
      if (!open) {
        // Reset on close
        setAutoScreenshot(null);
        setUploadedImages([]);
      }
    }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve Adiology by sharing your thoughts, reporting bugs, or requesting features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feedback Type Selection */}
          <div className="space-y-2">
            <Label>What would you like to share?</Label>
            <Select value={feedbackType} onValueChange={(value: 'feedback' | 'feature_request' | 'bug_report') => setFeedbackType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback">General Feedback</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating (only for feedback) */}
          {feedbackType === 'feedback' && (
            <div className="space-y-3">
              <Label>How would you rate your experience?</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: '1', label: 'Poor' },
                  { value: '2', label: 'Fair' },
                  { value: '3', label: 'Good' },
                  { value: '4', label: 'Very Good' },
                  { value: '5', label: 'Excellent' },
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`rating-${option.value}`} 
                      checked={rating === option.value} 
                      onCheckedChange={(checked: boolean) => setRating(checked ? option.value : '')}
                      className="size-5 border-2 border-slate-400 hover:border-indigo-600 data-[state=checked]:border-indigo-600" 
                    />
                    <Label htmlFor={`rating-${option.value}`} className="cursor-pointer text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message">
              {feedbackType === 'feedback' ? 'Your Feedback' : feedbackType === 'bug_report' ? 'Describe the Bug' : 'Feature Request Details'}
            </Label>
            <Textarea
              id="feedback-message"
              placeholder={
                feedbackType === 'feedback'
                  ? 'Tell us what you think about Adiology...'
                  : feedbackType === 'bug_report'
                  ? 'Describe what happened and what you expected...'
                  : 'Describe the feature you would like to see...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              {feedbackType === 'feature_request' && (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Be as detailed as possible to help us understand your needs
                </span>
              )}
              {feedbackType === 'bug_report' && (
                <span className="flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Screenshots are automatically attached to help us identify the issue
                </span>
              )}
            </p>
          </div>

          {/* Screenshot Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                Page Screenshot
              </Label>
              {isCapturingScreenshot && (
                <span className="text-xs text-slate-500 animate-pulse">Capturing...</span>
              )}
            </div>
            
            {autoScreenshot ? (
              <div className="relative group">
                <div className="border rounded-lg overflow-hidden bg-slate-50 p-2">
                  <img 
                    src={autoScreenshot} 
                    alt="Captured screenshot" 
                    className="w-full h-32 object-contain rounded"
                  />
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">Captured</span>
                    <span>{currentPage}</span>
                  </div>
                </div>
                <button
                  onClick={removeAutoScreenshot}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Remove screenshot"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : screenshotError ? (
              <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 bg-amber-50">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Auto-capture unavailable</p>
                    <p className="text-xs text-amber-600">Please upload a screenshot manually or retry</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={captureScreenshot}
                    disabled={isCapturingScreenshot}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Instead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureScreenshot}
                  disabled={isCapturingScreenshot}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isCapturingScreenshot ? 'Capturing...' : 'Capture Screenshot'}
                </Button>
              </div>
            )}
          </div>

          {/* Additional Images Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Additional Screenshots (Optional)
            </Label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadedImages.length >= 5}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Images ({uploadedImages.length}/5)
            </Button>
            <p className="text-xs text-slate-500">Max 5 images, 5MB each. JPG, PNG, GIF supported.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit {feedbackType === 'feature_request' ? 'Request' : feedbackType === 'bug_report' ? 'Report' : 'Feedback'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (variant === 'sidebar') {
    return (
      <>
        {/* Sidebar Menu Item Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={`w-full flex items-center gap-2 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer text-slate-700 hover:bg-indigo-50 ${
            !(sidebarOpen || sidebarHovered) 
              ? 'justify-center px-2' 
              : 'justify-start px-3'
          }`}
          aria-label="Provide Feedback"
          style={{ minWidth: 0 }}
        >
          <div className={`flex items-center ${!(sidebarOpen || sidebarHovered) ? 'justify-center flex-shrink-0' : 'gap-2 flex-1 min-w-0 overflow-hidden justify-start'}`}>
            <MessageSquare className={`w-5 h-5 shrink-0 ${!(sidebarOpen || sidebarHovered) ? 'text-slate-700 group-hover:text-indigo-600' : 'text-slate-500 group-hover:text-indigo-600'}`} />
            {(sidebarOpen || sidebarHovered) && (
              <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-left" style={{ fontSize: 'clamp(0.8125rem, 2.5vw, 0.9375rem)' }}>
                Feedback
              </span>
            )}
          </div>
        </button>
        
        {renderFeedbackDialog()}
      </>
    );
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 text-white shadow-lg hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300 hover:scale-110 flex items-center justify-center group animate-pulse hover:animate-none border-4 border-white"
        aria-label="Provide Feedback"
      >
        <MessageCircleHeart className="w-7 h-7 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-sm" />
      </button>

      {renderFeedbackDialog()}
    </>
  );
};
