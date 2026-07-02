import { logEvent } from 'firebase/analytics';
import { analytics } from '../lib/firebase';

export const trackEvent = async (eventName: string, data: Record<string, any> = {}) => {
  // 1. Client-Side Page/Event tracking (Firebase Analytics)
  if (analytics) {
    try {
      logEvent(analytics, eventName, data);
    } catch (e) {
      console.error("Firebase analytics logging failed", e);
    }
  }

  // 2. Server-side / Real-time Webhook Forwarding
  // Let the backend decide if this is a 'critical' event to trigger Slack/Telegram alerts
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        data,
      }),
    });
  } catch (e) {
    console.warn("Failed to ping tracking backend", e);
  }
};

// Convenience wrapper for page tracking
export const trackPage = (path: string) => {
  trackEvent('page_view', { page_path: path });
};
