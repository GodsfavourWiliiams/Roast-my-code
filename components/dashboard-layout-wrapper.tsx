"use client"

import { InstallAppBanner } from "@/components/install-app-banner"

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <InstallAppBanner />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
