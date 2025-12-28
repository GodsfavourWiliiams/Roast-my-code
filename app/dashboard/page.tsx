'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon,
  GithubLogo,
  TrendUp,
  Warning,
  Ghost,
  WarningOctagon,
} from '@phosphor-icons/react/dist/ssr';
import { Flame } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<{ recentRoasts: any[]; linkedRepos: any[] } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate empty state
      setData({ recentRoasts: [], linkedRepos: [] });
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
          <WarningOctagon size={64} className="text-destructive animate-pulse" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-destructive mb-2">
          Command Center Offline
        </h2>
        <p className="max-w-md text-muted-foreground mb-6">
          &gt; Error: Connection refused by ego-server. <br/>
          &gt; Status: Terminal failure.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Toxic Command Center
          </h1>
          <p className="text-muted-foreground">
            Welcome back, code-monkey. Ready to have your feelings hurt today?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="h-10 font-semibold uppercase" disabled={isLoading}>
            <PlusIcon strokeWidth={4} /> Link More Trash
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Egos Bruised', icon: Flame, desc: 'Coward.' },
          { title: 'Total Tears (Litres)', icon: TrendUp, desc: 'Dry eyes? Impossible.' },
          { title: 'Objective Garbage', icon: Warning, desc: 'Safe... for now.' },
          { title: 'Hostages (Repos)', icon: GithubLogo, desc: 'Link a repo. I dare you.' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">{stat.desc}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 lg:col-span-5 border-border">
          <CardHeader>
            <CardTitle>Recent Slaughter</CardTitle>
            <CardDescription>
              A list of pull requests that didn&apos;t stand a chance.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-t border-border/50">
            {isLoading ? (
              <div className="w-full space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recentRoasts.length === 0 ? (
              <>
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Ghost size={32} className="text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">No victims found</h3>
                <p className="text-muted-foreground text-sm max-w-[250px] mt-2 mb-6">
                  It seems you haven't submitted any PRs for me to destroy yet.
                </p>
                <Button variant="outline" className="uppercase font-bold">
                  Submit Code
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-3 lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle>Victim List</CardTitle>
            <CardDescription>
              Codebases I currently have to look at.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-t border-border/50">
            {isLoading ? (
               <div className="w-full space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.linkedRepos.length === 0 ? (
              <>
                <div className="rounded-full bg-muted p-4 mb-4">
                  <GithubLogo size={32} className="text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">No Repos Connected</h3>
                <p className="text-muted-foreground text-sm max-w-[200px] mt-2 mb-6">
                  Connect a repository so I can complain.
                </p>
                <Button size="sm" className="uppercase font-bold">
                  Connect Repo
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
