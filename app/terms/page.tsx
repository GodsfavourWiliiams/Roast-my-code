import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Abuse</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
            <p>
              By using RoastBot, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>RoastBot will ruthlessly critique your code</li>
              <li>You waive all rights to emotional damages</li>
              <li>The AI&apos;s sarcasm is a feature, not a bug</li>
              <li>You will not hold us responsible for hurt feelings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Service Usage</h2>
            <p>
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use RoastBot only for legitimate code reviews</li>
              <li>Not abuse the service or attempt to break it</li>
              <li>Accept that sometimes the AI is right and you&apos;re wrong</li>
              <li>Not take the roasts personally (we know, easier said than done)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <p>
              RoastBot is provided &quot;as is&quot;. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your code actually being bad (that&apos;s on you)</li>
              <li>Emotional trauma from reading your roast</li>
              <li>Your team&apos;s reaction to the AI&apos;s brutal honesty</li>
              <li>Any existential crises caused by code quality revelations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
            <p>
              We reserve the right to terminate your access if you abuse the service or write code so bad it breaks our AI.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
