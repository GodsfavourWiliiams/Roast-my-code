'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GitPullRequest,
  Terminal,
  ShieldAlert,
  Zap,
  Github,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Code2,
  Flame,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GithubLogoIcon } from '@phosphor-icons/react/dist/ssr';
import { useAuth } from '@/components/auth-provider';

// Animation variants for smooth, professional feel
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 selection:bg-red-500/20 selection:text-red-200 font-sans">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-soft-light"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Flame className="w-5 h-5 text-red-500" fill="currentColor" />
            <span className="font-semibold tracking-tight text-lg">
              RoastBot
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link
              href="#features"
              className="hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#integration"
              className="hover:text-white transition-colors"
            >
              Integration
            </Link>
            <Link
              href="#pricing"
              className="hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {!isLoading &&
              (user ? (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-400 hover:text-white hidden sm:block"
                >
                  Dashboard
                </Link>
              ) : (
                <Link href="/login">
                  <Button className="bg-white text-black hover:bg-slate-200 font-medium h-9 rounded-full px-5 text-sm">
                    Log in
                  </Button>
                </Link>
              ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="outline"
                className="mb-6 px-3 py-1 rounded-full border-red-500/20 bg-red-500/5 text-red-400 font-medium text-xs tracking-wide uppercase"
              >
                v2.0: Now 30% Meaner
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-bold tracking-tight hover:text-white mb-6 leading-[1.1]"
            >
              Code reviews that <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-orange-400">
                hurt your feelings.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed"
            >
              Connect your repository. Open a Pull Request. Get roasted by an AI
              trained to emulate a cynical Senior Engineer who hates spaghetti
              code.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Button className="h-12 rounded-full bg-red-600 hover:bg-red-700 text-white px-10 font-medium text-base shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105">
                <GithubLogoIcon className="w-5 h-5" />
                Connect Repository
              </Button>
              <Button
                variant="outline"
                className="h-12 px-8 rounded-full border-white/10 text-white hover:bg-white/5 font-medium text-base"
              >
                View Live Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Visual - The "Roast" Interface */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-linear-to-t from-red-500/10 to-transparent blur-3xl -z-10" />
            <div className="rounded-xl border border-white/10 bg-[#0F0F10] shadow-2xl overflow-hidden">
              {/* Fake Browser Toolbar */}
              <div className="flex items-center gap-2 px-4 h-10 border-b border-white/5 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="ml-4 text-xs font-mono text-foreground flex items-center gap-2">
                  <GitPullRequest className="w-3 h-3" />
                  feat/user-auth-refactor
                </div>
              </div>

              {/* Code View */}
              <div className="grid md:grid-cols-2">
                <div className="p-6 font-mono text-sm overflow-hidden border-r border-white/5 bg-[#0A0A0A]">
                  <div className="flex gap-4 opacity-50 select-none">
                    <div className="text-right text-slate-600 space-y-1">
                      {[...Array(10)].map((_, i) => (
                        <div key={i}>{i + 142}</div>
                      ))}
                    </div>
                    <div className="space-y-1 text-slate-300">
                      <p>
                        <span className="text-purple-400">const</span>{' '}
                        <span className="text-blue-400">handleSubmit</span> ={' '}
                        <span className="text-purple-400">async</span> (data) =
                        {'>'} {'{'}
                      </p>
                      <p className="pl-4">
                        <span className="text-slate-500"></span>
                      </p>
                      <p className="pl-4">
                        <span className="text-purple-400">if</span>{' '}
                        (data.password.length {'<'} 6) {'{'}
                      </p>
                      <p className="pl-8">
                        alert(
                        <span className="text-green-400">
                          &apos;Bad password&apos;
                        </span>
                        );
                      </p>
                      <p className="pl-8">
                        <span className="text-purple-400">return</span>{' '}
                        <span className="text-purple-400">false</span>;
                      </p>
                      <p className="pl-4">{'}'}</p>
                      <p className="pl-4">
                        <span className="text-purple-400">await</span>{' '}
                        db.users.create(data);
                      </p>
                      <p className="pl-4">window.location.reload();</p>
                      <p>{'}'}</p>
                    </div>
                  </div>
                </div>

                {/* The Bot Comment */}
                <div className="p-6 bg-[#111] flex flex-col justify-center">
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          RoastBot
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-red-500/10 text-red-400 text-[10px] h-5 px-1.5"
                        >
                          AI Reviewer
                        </Badge>
                      </div>
                      <span className="text-xs text-foreground">Just now</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                    <p>
                      I&apos;ve seen better code on a sticky note in a dumpster.
                    </p>
                    <p>
                      1.{' '}
                      <code className="bg-white/10 px-1 rounded text-red-200">
                        alert()
                      </code>{' '}
                      in 2025? Are we building a Geocities page?
                      <br />
                      2.{' '}
                      <code className="bg-white/10 px-1 rounded text-red-200">
                        window.location.reload()
                      </code>{' '}
                      is the architectural equivalent of burning down the house
                      to turn off the lights.
                    </p>
                    <p className="font-medium text-red-400">
                      Requesting Changes. Do not merge until you apologize to
                      the compiler.
                    </p>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-foreground hover:text-white hover:bg-white/5"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1.5" /> Accept Fate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-foreground hover:text-white hover:bg-white/5"
                    >
                      <XCircle className="w-3 h-3 mr-1.5" /> Cry in Corner
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Social Proof (Satire) */}
        <section className="py-10 border-y border-white/5 bg-white/2">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-medium text-foreground mb-8 uppercase tracking-widest">
              Terrorizing engineering teams at
            </p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale">
              {[
                'Acme Corp',
                'Globex',
                'Soylent',
                'Initech',
                'Massive Dynamic',
              ].map((company) => (
                <span
                  key={company}
                  className="text-xl font-bold font-mono tracking-tighter text-white"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-20 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Why use standard linting <br />
                <span className="text-slate-500">
                  when you can have psychological warfare?
                </span>
              </h2>
              <p className="text-slate-400 text-lg">
                Most tools catch syntax errors. RoastBot catches skill issues.
                It enforces best practices through rigorous shame-based
                reinforcement learning.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<ShieldAlert className="w-6 h-6 text-red-400" />}
                title="Ruthless Gatekeeping"
                description="RoastBot will block merges if it detects bad patterns, lack of types, or weak variable names."
              />
              <FeatureCard
                icon={<Code2 className="w-6 h-6 text-orange-400" />}
                title="Context Aware"
                description="It understands your entire codebase, which gives it more ammunition to explain why your new feature is redundant."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6 text-yellow-400" />}
                title="Instant Feedback"
                description="Why wait for a senior engineer to wake up? Get demoralized instantly, 24/7, anywhere in the world."
              />
              <div className="md:col-span-2 rounded-xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 p-8 flex flex-col md:flex-row gap-8 items-center overflow-hidden group">
                <div className="flex-1 space-y-4">
                  <div className="inline-flex items-center gap-2 text-green-400 text-xs font-mono border border-green-500/20 bg-green-500/10 px-2 py-1 rounded">
                    <Terminal className="w-3 h-3" />
                    <span>Positive Reinforcement Mode</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Occasionally Nice?
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    If you actually write clean, well-documented, tested code,
                    RoastBot might offer a rare compliment.
                    <span className="italic text-foreground">
                      {' '}
                      (Note: This feature is currently in beta and rarely
                      triggered).
                    </span>
                  </p>
                </div>
                <div className="w-full md:w-1/3 aspect-square bg-black/50 rounded-lg border border-white/5 p-4 relative group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                    <p className="font-mono text-green-400 text-sm">
                      &quot;This PR... doesn&apos;t entirely suck. Good
                      job.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <FeatureCard
                icon={<Github className="w-6 h-6 text-white" />}
                title="Zero Config"
                description="Install the GitHub app. Grant permissions. Prepare your ego."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[120px] -z-10" />

          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
              Ready to ship <br />
              better code?
            </h2>
            <p className="text-xl text-slate-400 mb-12">
              Join 10,000+ developers who are actively improving their craft
              through the power of negative reinforcement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button className="h-14 px-10 text-lg rounded-full bg-white text-black hover:bg-slate-200 transition-all font-semibold">
                  Get Roasted Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="ghost"
                  className="h-14 px-10 text-lg rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#050505] pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 text-white mb-4">
                <Flame className="w-5 h-5 text-red-500" fill="currentColor" />
                <span className="font-bold text-lg">RoastBot</span>
              </div>
              <p className="text-sm text-foreground">
                The AI code reviewer that treats you like a junior dev until you
                prove otherwise.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white">Product</h4>
                <ul className="space-y-2 text-sm text-foreground">
                  <li>
                    <Link
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Integrations
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Changelog
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white">Legal</h4>
                <ul className="space-y-2 text-sm text-foreground">
                  <li>
                    <Link
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Terms of Abuse
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
            <p>&copy; 2025 RoastBot Labs. All rights reserved.</p>
            <p>Made with hate.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-8 rounded-xl border border-white/10 bg-white/2 hover:bg-white/4 transition-colors duration-300">
      <div className="mb-6 w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}