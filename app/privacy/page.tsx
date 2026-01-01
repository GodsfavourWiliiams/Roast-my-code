import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Collection</h2>
            <p>
              RoastBot collects minimal data necessary to function:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>GitHub OAuth tokens for repository access</li>
              <li>Repository metadata (name, description, language)</li>
              <li>Pull request information and code diffs</li>
              <li>Your roast history and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Usage</h2>
            <p>
              We use your data solely to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Analyze your code and provide roasts</li>
              <li>Store your review history</li>
              <li>Send notifications about PR reviews</li>
              <li>Improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
            <p>
              Your data is stored securely using Supabase. We never share your code or personal information with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
            <p>
              You can delete your account and all associated data at any time from the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p>
              For privacy concerns, contact us through your GitHub repository issues.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
