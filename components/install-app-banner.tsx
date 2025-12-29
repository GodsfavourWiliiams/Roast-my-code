"use client"

import { useQuery } from "@tanstack/react-query"
import { getUserSettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { GithubLogo, Warning } from "@phosphor-icons/react/dist/ssr"

export function InstallAppBanner() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
        const { settings } = await getUserSettings();
        return settings;
    }
  });

  if (isLoading || !settings || settings.installation_id) return null;

  const INSTALL_URL = `https://github.com/apps/roastbot-app/installations/new`; // Replace with your actual App Name URL later

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-yellow-600">
                <Warning weight="fill" size={20} />
                <span className="text-sm font-medium">RoastBot is not installed on your GitHub account. Automated PR roasting is disabled.</span>
            </div>
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white border-0" asChild>
                <a href={INSTALL_URL} target="_blank" rel="noopener noreferrer">
                    <GithubLogo className="mr-2" weight="bold" />
                    Install App
                </a>
            </Button>
        </div>
    </div>
  )
}
