"use client"

import {
  House,
  GithubLogo,
  Lightning,
  ChartBar,
  Gear,
  SignOut,
} from '@phosphor-icons/react/dist/ssr';
import { Flame } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

// Menu items... (rest remains the same)
const items = [
  {
    title: 'Command Center',
    url: '/dashboard',
    icon: House,
    tooltip: 'Global overview of your failures',
  },
  {
    title: 'The Cemetery',
    url: '/dashboard/repos',
    icon: GithubLogo,
    tooltip: "Repositories you've abandoned",
  },
  {
    title: 'Brutal History',
    url: '/dashboard/roasts',
    icon: Lightning,
    tooltip: 'Log of past insults',
  },
  {
    title: 'Pain Analytics',
    url: '/dashboard/analytics',
    icon: ChartBar,
    tooltip: 'Charts showing your decline',
  },
  {
    title: 'Compliance',
    url: '/dashboard/settings',
    icon: Gear,
    tooltip: 'Settings & Security',
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Junior Dev';
  const userEmail = user?.email || 'junior@dev.co';
  const userAvatar = user?.user_metadata?.avatar_url || '';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center gap-2 p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Flame className="h-5 w-5 fill-current" />
        </div>
        <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
          RoastBot
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== '/dashboard' && pathname.startsWith(item.url));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.tooltip}
                >
                  <Link href={item.url}>
                    <item.icon
                      size={16}
                      weight={isActive ? 'bold' : 'regular'}
                    />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-2 w-full p-1">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-1 w-full overflow-hidden group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-24" />
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center w-full outline-none hover:bg-muted/50 p-1 transition-colors rounded-md">
                <Avatar className="size-10">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold">
                    {userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="text-sm font-bold truncate">{userName}</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {userEmail}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-[200px]">
              <DropdownMenuItem
                className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive gap-2 cursor-pointer"
                onClick={logout}
              >
                <SignOut size={16} weight="bold" />
                Terminate Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
