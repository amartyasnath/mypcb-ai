import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import ChatApp from './pages/ChatApp';
import LandingPage from './pages/LandingPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsConditions } from './pages/TermsConditions';
import { CookieConsent } from './components/CookieConsent';
import { trackPage } from './utils/analytics';

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPage(location.pathname);
  }, [location]);
  return null;
}

/**
 * Without a catch-all route, an unknown URL matches nothing and React renders an
 * empty page. The server returns index.html for every path (SPA fallback), so
 * this is the only place a bad link can be handled.
 */
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <p className="text-sm font-mono text-muted-foreground mb-3">404</p>
      <h1 className="text-3xl font-bold font-heading mb-4 tracking-tight">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        That page doesn't exist. It may have moved, or the link may be incorrect.
      </p>
      <div className="flex gap-4">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          Back to home
        </Link>
        <Link
          to="/app"
          className="px-5 py-2.5 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
        >
          Open workspace
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative">
        <RouteTracker />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<ChatApp />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </div>
    </BrowserRouter>
  );
}
