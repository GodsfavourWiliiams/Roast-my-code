import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs"
import { InstallAppBanner } from "@/components/install-app-banner"
import { NotificationBell } from "@/components/notification-bell"
import { RealtimeProvider } from "@/components/realtime-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background z-10">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <DashboardBreadcrumbs />
            </div>
            <NotificationBell />
        </header>
        <InstallAppBanner />
        <RealtimeProvider>
            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/20">
                {children}
            </div>
        </RealtimeProvider>
      </main>
    </SidebarProvider>
  )
}
