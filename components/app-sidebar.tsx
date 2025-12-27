"use client"

import {
  House,
  GithubLogo,
  Lightning,
  ChartBar,
  Gear
} from "@phosphor-icons/react/dist/ssr"
import { Flame } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Menu items.
const items = [
  {
    title: "Command Center",
    url: "/dashboard",
    icon: House,
    tooltip: "Global overview of your failures"
  },
  {
    title: "The Cemetery",
    url: "/dashboard/repos",
    icon: GithubLogo,
    tooltip: "Repositories you've abandoned"
  },
  {
    title: "Brutal History",
    url: "/dashboard/roasts",
    icon: Lightning,
    tooltip: "Log of past insults"
  },
  {
    title: "Pain Analytics",
    url: "/dashboard/analytics",
    icon: ChartBar,
    tooltip: "Charts showing your decline"
  },
  {
    title: "Compliance",
    url: "/dashboard/settings",
    icon: Gear,
    tooltip: "Settings & Security"
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
        <SidebarHeader className="flex flex-row items-center gap-2 p-4">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
                <Flame className="h-5 w-5 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">RoastBot</span>
        </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton size="lg" asChild isActive={isActive} tooltip={item.tooltip}>
                      <a className="flex items-center gap-2 px-4" href={item.url}>
                        <item.icon size={16} weight={isActive ? "bold" : "regular"} />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8 rounded-none border border-border">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">Senior Dev</span>
                <span className="text-xs text-muted-foreground">senior@dev.co</span>
            </div>
          </div>
      </SidebarFooter>
    </Sidebar>
  )
}
