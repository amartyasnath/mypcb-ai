import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Bump this whenever the policy text below changes. It must not be generated
// from the current date, or the page claims a fresh revision every single day.
const LAST_UPDATED = 'August 28, 2026';

// TODO (blocking for launch): this mailbox must actually exist and be monitored.
// The policy below promises account-deletion requests are actioned here, so a
// dead address is a compliance problem, not just a broken link.
const CONTACT_EMAIL = 'support@mypcb.ai';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
        </Link>
        <div className="bg-white p-8 md:p-12 border border-slate-200 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-blue-600">
            <p><strong>Last Updated: {LAST_UPDATED}</strong></p>
            <p>
              Welcome to myPCB.ai. This Privacy Policy outlines how we collect, use, and protect your information when you use our electronic component recommendation service.
            </p>

            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us when using our chat interface (such as project requirements and specifications), as well as information collected automatically (such as IP addresses, browser types, and usage data). If you create an account, we collect your name and email address.
            </p>

            <h3>2. How We Use Your Information</h3>
            <ul>
              <li>Provide, maintain, and improve our component recommendation engine.</li>
              <li>Communicate with you regarding updates, security alerts, and support messages.</li>
              <li>Analyze usage trends to enhance our platform's performance and accuracy.</li>
            </ul>

            <h3>3. How Your Prompts Are Handled</h3>
            <p>
              We want to be precise about this, because it affects your intellectual property:
            </p>
            <ul>
              <li>
                All traffic between your browser and our servers is encrypted in transit using TLS (HTTPS).
                We do <strong>not</strong> offer end-to-end encryption: our servers process your prompts in
                plain text in order to generate recommendations.
              </li>
              <li>
                To answer your question, the content of your prompt is sent to the Anthropic Claude API.
                Its handling is additionally governed by Anthropic's terms and privacy policy.
              </li>
              <li>
                To find current parts, pricing and availability, Claude may run web searches derived from
                your request. Search queries are processed by Anthropic's search provider.
              </li>
              <li>
                If you are signed in, your conversation history is stored in Google Firestore, associated
                with your account, so that you can return to it later. It is encrypted at rest by Google
                Cloud and is readable by our systems.
              </li>
              <li>
                We do not sell your prompts, and we do not use them to train our own models.
              </li>
            </ul>
            <p>
              <strong>Please do not paste secrets, credentials, or third-party confidential information
              into the chat.</strong> Treat prompts as you would any other data submitted to a hosted web service.
            </p>

            <h3>4. Third Parties We Share Data With</h3>
            <ul>
              <li><strong>Anthropic (Claude API)</strong> — receives your prompt text to generate responses, and runs web searches on your behalf to find current part data.</li>
              <li><strong>Google Firebase / Firestore</strong> — authentication and storage of your account and chat history.</li>
              <li><strong>Google Analytics for Firebase</strong> — anonymous usage and page-view analytics.</li>
              <li><strong>Discord</strong> — if you submit feedback or a support request, the message and your email are forwarded to our internal Discord channel so we can respond.</li>
            </ul>

            <h3>5. Data Retention and Your Rights</h3>
            <p>
              You can delete any individual conversation from the sidebar in the app at any time, which removes it from our database. If you would like your account and all associated data deleted, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will action the request. Depending on where you live, you may have additional rights to access, correct, or export your personal data.
            </p>

            <h3>6. Cookies and Tracking</h3>
            <p>
              We use cookies and similar browser storage to remember your preferences (such as cookie consent) and to understand how you interact with our website. You can modify your cookie settings in your browser.
            </p>

            <h3>7. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
