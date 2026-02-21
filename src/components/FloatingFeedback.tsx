import { useState } from 'react';
import { MessageSquarePlus, X, Star, Send, Loader2, CheckCircle } from 'lucide-react';
import { submitFeedback, type FeedbackData } from '../utils/feedbackService';

type FeedbackType = FeedbackData['type'];

export function FloatingFeedback() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feedback');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setType('feedback');
    setRating(0);
    setHoverRating(0);
    setMessage('');
    setError('');
    setSent(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitFeedback({
        type,
        rating: rating || undefined,
        message: message.trim(),
        pageUrl: window.location.href,
        pageName: document.title,
        browserInfo: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      });
      setSent(true);
      setTimeout(handleClose, 1800);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const typeOptions: { value: FeedbackType; label: string; emoji: string }[] = [
    { value: 'feedback', label: 'Feedback', emoji: '💬' },
    { value: 'feature_request', label: 'Feature Request', emoji: '💡' },
    { value: 'bug_report', label: 'Bug Report', emoji: '🐛' },
  ];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
          aria-label="Send Feedback"
        >
          <MessageSquarePlus className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4 flex items-center justify-between">
            <h3 className="text-white font-semibold text-base">Share Your Feedback</h3>
            <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {sent ? (
            <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium text-gray-800">Thank you!</p>
              <p className="text-sm text-gray-500">Your feedback has been submitted.</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              <div className="flex gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`flex-1 text-xs font-medium py-2 px-2 rounded-lg border transition-all ${
                      type === opt.value
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{opt.emoji}</span> {opt.label}
                  </button>
                ))}
              </div>

              {type === 'feedback' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">How would you rate your experience?</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  {type === 'bug_report' ? 'Describe the issue' : type === 'feature_request' ? 'Describe your idea' : 'Your message'}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === 'bug_report'
                      ? 'What happened? What did you expect?'
                      : type === 'feature_request'
                      ? 'What feature would help you?'
                      : 'Tell us what you think...'
                  }
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={sending}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
