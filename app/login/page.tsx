'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  GithubLogoIcon,
  CircleNotchIcon,
} from '@phosphor-icons/react/dist/ssr';
import { useAuth } from '@/components/auth-provider';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';

function LoginForm() {
  const { login, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <Card className="w-full max-w-md border-2 border-border shadow-[4px_4px_0px_0px_var(--primary)]">
      <CardHeader className="space-y-4 text-center pb-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground p-4">
          <Image
            src="/logo-white.svg"
            alt="RoastBot Logo"
            width={32}
            height={32}
            className="w-full h-full"
          />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight uppercase">
            Identify Yourself
          </CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            Access Restricted to Developers
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-mono border border-destructive/20 wrap-break-word">
            Error: {error}
          </div>
        )}
        <p className="text-muted-foreground">
          Connect your GitHub account. We need access to your repositories to
          analyze exactly how bad your code really is.
        </p>
        <div className="bg-muted p-4 border border-border font-mono text-xs text-left space-y-2">
          <p className="text-green-600 dark:text-green-400">
            $ initiating_handshake...
          </p>
          <p className="text-muted-foreground">$ awaiting_credentials...</p>
          {isLoading && (
            <p className="text-primary font-bold italic animate-pulse">
              # verifying_ego_levels...
            </p>
          )}
          <p className="animate-pulse">_</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          size="lg"
          className="w-full gap-3 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={login}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircleNotchIcon className="h-5 w-5 animate-spin" />
          ) : (
            <GithubLogoIcon size={20} weight="bold" />
          )}
          {isLoading ? 'Verifying...' : 'Authorize via GitHub'}
        </Button>
        <div className="space-y-2 text-center">
          <p className="text-[10px] text-muted-foreground px-8 leading-tight">
            Note: You may be asked to install the{' '}
            <strong>RoastBot GitHub App</strong> after login to allow the bot to
            comment on your Pull Requests.
          </p>
          <p className="text-xs text-muted-foreground px-8">
            By clicking above, you agree to waive all rights to emotional
            damages caused by our code review.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}