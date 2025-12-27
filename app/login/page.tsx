import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GithubLogo, Code } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-border shadow-[4px_4px_0px_0px_var(--primary)]">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-none bg-primary text-primary-foreground">
            <Code size={32} weight="bold" />
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
            <p className="text-muted-foreground">
                Connect your GitHub account. We need access to your repositories to analyze exactly how bad your code really is.
            </p>
            <div className="bg-muted p-4 border border-border font-mono text-xs text-left space-y-2">
                <p className="text-green-600 dark:text-green-400">$ initiating_handshake...</p>
                <p className="text-muted-foreground">$ awaiting_credentials...</p>
                <p className="animate-pulse">_</p>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button size="lg" className="w-full gap-3 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            {/* In a real app, this would perform an auth action. For now, we link to dashboard. */}
            <Link href="/dashboard">
                <GithubLogo size={20} weight="bold" />
                Authorize via GitHub
            </Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground px-8">
            By clicking above, you agree to waive all rights to emotional damages caused by our code review.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
