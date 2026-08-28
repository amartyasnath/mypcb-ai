import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Bump this whenever the terms below change; it must not track the current date.
const LAST_UPDATED = 'August 28, 2026';

export const TermsConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
        </Link>
        <div className="bg-white p-8 md:p-12 border border-slate-200 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms and Conditions</h1>
          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-blue-600">
            <p><strong>Last Updated: {LAST_UPDATED}</strong></p>
            <p>
              Please read these Terms and Conditions ("Terms") carefully before using the myPCB.ai platform.
            </p>

            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using myPCB.ai, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3>2. Service Description</h3>
            <p>
              myPCB.ai is an AI-powered recommendation engine that assists electronic engineers and hobbyists in sourcing electronic components based on provided specifications. The recommendations provided are for informational purposes.
            </p>

            <h3>3. No Liability for Design Failures</h3>
            <p>
              <strong>Disclaimer:</strong> The components recommended by our AI are suggestions based on available datasheet metrics and algorithms. myPCB.ai is not responsible for any design failures, manufacturing issues, or financial losses resulting from the use of recommended components. Engineers must independently verify component specifications, symbols, footprints, and compatibility before committing to production.
            </p>

            <h3>4. User Accounts</h3>
            <p>
              If you create an account, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account.
            </p>

            <h3>5. Manufacturer Partnerships</h3>
            <p>
              Component manufacturers may partner with us to ensure their component databases are up to date within our system. This does not guarantee recommendation but guarantees accurate technical assessment by our algorithms.
            </p>

            <h3>6. Modifications</h3>
            <p>
              We reserve the right to modify or replace these terms at any time. Your continued use of the platform after any such changes constitutes your acceptance of the new terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
