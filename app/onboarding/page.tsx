"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { CheckCircleIcon, GithubLogoIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getUserSettings } from "@/app/actions/settings"
import { syncInstallation } from "@/app/actions/github-installation"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function OnboardingPage() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  const { data: settings, refetch } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const { settings } = await getUserSettings()
      return settings
    }
  })

  const handleSync = async () => {
    setSyncing(true)
    const { success, error } = await syncInstallation()
    if (success) {
        await refetch()
        toast.success("Connected successfully!")
    } else {
        toast.error(error || "Could not find installation.")
    }
    setSyncing(false)
  }

  const isInstalled = !!settings?.installation_id

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-lg border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to RoastBot</CardTitle>
          <CardDescription>
            Let's get your code ready for destruction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            {/* Step 1: Account (Done) */}
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-background opacity-50">
                <div className="h-8 w-8 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center">
                    <CheckCircleIcon weight="fill" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm">Create Account</h3>
                    <p className="text-xs text-muted-foreground">Connected via GitHub OAuth</p>
                </div>
            </div>

            {/* Step 2: Install App */}
            <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${isInstalled ? 'bg-green-500/10 border-green-500/20' : 'bg-background border-primary'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isInstalled ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary'}`}>
                    {isInstalled ? <CheckCircleIcon weight="fill" size={20} /> : <span className="font-bold text-sm">2</span>}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm">Install RoastBot App</h3>
                    <p className="text-xs text-muted-foreground">
                        {isInstalled ? "App installed successfully." : "Grant us access to roast your PRs."}
                    </p>
                </div>
                {!isInstalled && (
                    <Button size="sm" asChild>
                        <a href="https://github.com/apps/roastbot-app/installations/new" target="_blank" rel="noopener noreferrer">
                            Install
                        </a>
                    </Button>
                )}
            </div>

        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleSync} disabled={syncing || isInstalled}>
                {syncing ? "Checking..." : "I've installed it"}
            </Button>
            
            <Button 
                disabled={!isInstalled} 
                onClick={() => router.push('/dashboard')}
                className="gap-2"
            >
                Go to Dashboard <ArrowRightIcon weight="bold" />
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
