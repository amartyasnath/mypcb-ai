import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
            <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
            <p>
              Welcome to myPCB.ai. This Privacy Policy outlines how we collect, use, and protect your information when you use our electronic component recommendation service.
            </p>
            
            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us when using our chat interface (such as project requirements and specifications), as well as information collected automatically (such as IP addresses, browser types, and usage data). If you create an account, we collect your name and email address.
            </p>

            <h3>2. How We Use Your Information</h3>
            <p>
              We use your information to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our component recommendation engine.</li>
              <li>Communicate with you regarding updates, security alerts, and support messages.</li>
              <li>Analyze usage trends to enhance our platform's performance and accuracy.</li>
            </ul>

            <h3>3. End-to-End Encryption & Prompt Security</h3>
            <p>
              We respect your intellectual property. All project prompts and conversations are end-to-end encrypted to ensure your proprietary designs and plans are not leaked. We do not use your private project queries to train public AI models.
            </p>

            <h3>4. Cookies and Tracking</h3>
            <p>
              We use cookies to remember your preferences (such as cookie consent) and to understand how you interact with our website to improve the user experience. You can modify your cookie settings in your browser.
            </p>

            <h3>5. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@mypcb.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
