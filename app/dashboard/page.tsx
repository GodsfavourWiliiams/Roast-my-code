'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon,
  GithubLogoIcon,
  TrendUpIcon,
  WarningIcon,
  GhostIcon,
  WarningOctagonIcon,
  SkullIcon,
  ArrowRightIcon,
  GitPullRequestIcon,
  WarningCircleIcon,
  ActivityIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Flame } from 'lucide-react';
import { getDashboardData } from '@/app/actions/dashboard';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/lib/routes';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const result = await getDashboardData();
      if (result.error) throw new Error(result.error);
      return result;
    },
  });

  if (isError) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
          <WarningOctagonIcon size={64} className="text-destructive animate-pulse" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-destructive mb-2">
          Command Center Offline
        </h2>
        <p className="max-w-md text-muted-foreground mb-6">
          &gt; Error: Connection refused by ego-server. <br />
          &gt; Status: Terminal failure.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reconnect
        </Button>
      </div>
    );
  }

  const { stats, recent_roasts = [], score_trend = [], repo_crimes = [] } = data || {};

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Toxic Command Center</h1>
          <p className="text-muted-foreground">Welcome back, code-monkey. Ready to have your feelings hurt?</p>
        </div>
        <Link href={ROUTES.DASHBOARD.REPOS}>
          <Button
            className="h-10 font-semibold uppercase"
            disabled={isLoading}
          >
            <PlusIcon strokeWidth={4} className="mr-2" /> Link More Trash
          </Button>
        </Link>
      </div>

      {/* Stats Grid - 6 Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard 
            title="Avg Score" 
            value={stats ? `${stats.avg_score}/10` : undefined} 
            desc="Overall competence" 
            icon={<ActivityIcon size={16} className="text-blue-400" />} 
            loading={isLoading}
        />
        <StatCard 
            title="Critical Issues" 
            value={stats?.critical_issues} 
            desc="Disastrous code crimes" 
            icon={<WarningCircleIcon size={16} className="text-destructive" />} 
            loading={isLoading}
        />
        <StatCard 
            title="Total Tears" 
            value={stats ? `${((stats.total_violations || 0) * 0.1).toFixed(1)}L` : undefined} 
            desc="Cumulative violations" 
            icon={<TrendUpIcon size={16} className="text-orange-500" />} 
            loading={isLoading}
        />
        <StatCard 
            title="Egos Bruised" 
            value={stats?.egos_bruised} 
            desc="Reviews performed" 
            icon={<Flame size={16} className="text-primary" />} 
            loading={isLoading}
        />
        <StatCard 
            title="Garbage" 
            value={stats?.active_repos} 
            desc="Active repositories" 
            icon={<WarningIcon size={16} className="text-yellow-500" />} 
            loading={isLoading}
        />
        <StatCard 
            title="Hostages" 
            value={stats?.hostages} 
            desc="Total repos linked" 
            icon={<GithubLogoIcon size={16} className="text-slate-400" />} 
            loading={isLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Charts Section */}
        <Card className="col-span-4 border-border">
          <CardHeader>
            <CardTitle className="text-lg">The Trend of Despair</CardTitle>
            <CardDescription>Your quality score over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
                <Skeleton className="h-full w-full" />
            ) : score_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={score_trend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis 
                          dataKey="createdAt" 
                          stroke="#888888" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => {
                            return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
                          }}
                        />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const dateStr = new Intl.DateTimeFormat('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }).format(new Date(payload[0].payload.createdAt));
                              
                              return (
                                <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
                                  <div className="mb-1 text-xs font-bold text-muted-foreground">
                                    {dateStr}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                    <span className="text-sm font-bold text-foreground">
                                      Score: {payload[0].value}
                                    </span>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                    Not enough trauma recorded to draw a line.
                </div>
            )}
          </CardContent>
        </Card>

        {/* Crimes by Repo */}
        <Card className="col-span-3 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Crimes by Repository</CardTitle>
            <CardDescription>Violations per codebase.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
                <Skeleton className="h-full w-full" />
            ) : repo_crimes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={repo_crimes}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                        <Bar dataKey="violations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                    The evidence locker is empty.
                </div>
            )}
          </CardContent>
        </Card>

        {/* Redesigned Recent Slaughter */}
        <Card className="col-span-4 lg:col-span-5 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg">Recent Slaughter</CardTitle>
                <CardDescription>Pull requests that didn&apos;t stand a chance.</CardDescription>
            </div>
            <Link href={ROUTES.DASHBOARD.ROASTS}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View All <ArrowRightIcon />
                </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recent_roasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border-t">
                <GhostIcon size={32} className="text-muted-foreground mb-4" />
                <h3 className="font-bold">No victims found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                  Submit some code so I can destroy your confidence.
                </p>
              </div>
            ) : (
                <div className="divide-y border-t">
                    {recent_roasts.map((roast) => (
                        <div key={roast.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${roast.roast_score >= 7 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                <GitPullRequestIcon size={20} weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{roast.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{roast.repo_name} • {new Date(roast.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-lg font-black leading-none ${roast.roast_score >= 7 ? 'text-green-500' : 'text-destructive'}`}>
                                    {roast.roast_score}/10
                                </span>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Score</span>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={ROUTES.DASHBOARD.REPO_DETAILS(roast.repo_name)}>Details</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Victim List (Quick View) */}
        <Card className="col-span-3 lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Victim List</CardTitle>
            <CardDescription>Management shortcuts.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 border-t flex flex-col items-center justify-center text-center opacity-50 italic text-sm min-h-[200px]">
            <SkullIcon size={32} className="mb-2" />
            Manage all victims in <br/>
            <Link href={ROUTES.DASHBOARD.REPOS} className="text-primary hover:underline not-italic font-bold mt-1 inline-block text-base">The Cemetery</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, desc, icon, loading }: { title: string, value?: number | string, desc: string, icon: React.ReactNode, loading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight truncate pr-1">{title}</CardTitle>
                <div className="shrink-0">{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-12" />
                        <Skeleton className="h-2 w-16" />
                    </div>
                ) : (
                    <>
                        <div className="text-xl font-black break-all leading-tight">{value ?? 0}</div>
                        <p className="text-[9px] text-muted-foreground truncate mt-1" title={desc}>{desc}</p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
