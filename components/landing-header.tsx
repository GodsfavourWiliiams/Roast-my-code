'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr';
import { useAuth } from '@/components/auth-provider';
import { ROUTES } from '@/lib/routes';
import { Flame } from 'lucide-react';

function getInitials(user: { user_metadata?: { full_name?: string }; email?: string } | null): string {
  if (!user) return 'U';
  const name = user.user_metadata?.full_name || user.email;
  return name ? name.substring(0, 2).toUpperCase() : 'U';
}

export function LandingHeader() {
  const { user, isLoading, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Flame className="w-5 h-5 text-red-500" fill="currentColor" />
          <span className="font-semibold tracking-tight text-lg">
            RoastBot
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          {/* Navigation links can be added here if needed */}
        </div>

        <div className="flex items-center gap-4">
          {!isLoading &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:block outline-none">
                    <Avatar className="size-9 border-2 border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-red-500/20 text-red-400 text-xs font-bold">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.DASHBOARD.HOME} className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive gap-2 cursor-pointer"
                    onClick={logout}
                  >
                    <SignOutIcon size={16} weight="bold" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
  );
}
