'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { CtaButton } from '@/components/cta-button';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Pricing</h1>
          <p className="text-xl text-slate-400">
            Free forever. Because your code needs help, not your wallet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="border border-white/10 rounded-xl p-8 bg-white/2">
            <h2 className="text-2xl font-bold text-white mb-2">Free Tier</h2>
            <div className="text-4xl font-bold text-white mb-6">
              $0<span className="text-lg text-slate-400">/forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Unlimited PR reviews
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Manual file roasts
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                All personas
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Unlimited repositories
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Full roast history
              </li>
            </ul>
            <CtaButton 
              label="Get Started Free" 
              href="/login"
              className="w-full"
            />
          </div>

          <div className="border border-red-500/20 rounded-xl p-8 bg-red-500/5 relative">
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              COMING SOON
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pro Tier</h2>
            <div className="text-4xl font-bold text-white mb-6">
              $10<span className="text-lg text-slate-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Everything in Free
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                GPT-4o model option
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Priority processing
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Custom personas
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-green-400" />
                Advanced analytics
              </li>
            </ul>
            <Button 
              disabled
              className="w-full bg-slate-700 text-slate-400 cursor-not-allowed"
            >
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
