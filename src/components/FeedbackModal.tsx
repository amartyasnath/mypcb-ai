import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Bug, Building2, Send, CheckCircle2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { trackEvent } from '../utils/analytics';

interface Props {
  onClose: () => void;
  initialType?: 'support' | 'bug' | 'manufacturer';
}

type FeedbackType = 'support' | 'bug' | 'manufacturer';

export const FeedbackModal: React.FC<Props> = ({ onClose, initialType = 'support' }) => {
  const [type, setType] = useState<FeedbackType>(initialType);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, email }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Message delivery failed. Please try again.');
      }
      
      trackEvent('feedback_submitted', { type });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message delivery failed.');
      console.error('Failed to submit feedback', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Get in Touch</h2>
            <p className="text-slate-500 text-sm mb-6">
              Found a bug? Need support? Or perhaps you're a manufacturer looking to partner? Let us know.
            </p>

            {success ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-500">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">How can we help?</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('support')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border ${type === 'support' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} transition-colors cursor-pointer`}
                    >
                      <MessageSquare className="w-5 h-5 mb-2" />
                      <span className="text-xs font-medium">Support</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('bug')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border ${type === 'bug' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} transition-colors cursor-pointer`}
                    >
                      <Bug className="w-5 h-5 mb-2" />
                      <span className="text-xs font-medium">Report Bug</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('manufacturer')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border ${type === 'manufacturer' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} transition-colors cursor-pointer`}
                    >
                      <Building2 className="w-5 h-5 mb-2" />
                      <span className="text-xs font-medium">Partner</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                    placeholder={
                      type === 'manufacturer' 
                        ? "Tell us about your components and company..." 
                        : type === 'bug' 
                          ? "Please describe the issue you encountered..." 
                          : "How can we help you today?"
                    }
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !message.trim() || !email.trim()}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
