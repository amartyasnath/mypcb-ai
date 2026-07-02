import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
        </Routes>
        <CookieConsent />
      </div>
    </BrowserRouter>
  );
}
