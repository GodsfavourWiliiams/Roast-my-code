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
} from '@phosphor-icons/react/dist/ssr';
import { Flame } from 'lucide-react';
import { getSavedRepos } from '@/app/actions/github';
import { fetchDashboardStats, fetchRecentRoasts } from '@/app/actions/dashboard';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  // Query for Saved Repos (Victim List)
  const {
    data: linked_repos = [],
    isLoading: is_loading_repos,
    isError: is_error_repos,
  } = useQuery({
    queryKey: ['savedRepos'],
    queryFn: async () => {
      const { repos, error } = await getSavedRepos();
      if (error) throw new Error(error);
      return repos;
    },
  });

  // Query for Stats
  const {
    data: stats,
    isLoading: is_loading_stats,
    isError: is_error_stats,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { stats, error } = await fetchDashboardStats();
      if (error) throw new Error(error);
      return stats;
    },
  });

  // Query for Recent Roasts
  const {
    data: recent_roasts = [],
    isLoading: is_loading_roasts,
    isError: is_error_roasts,
  } = useQuery({
    queryKey: ['recentRoasts'],
    queryFn: async () => {
      const { roasts, error } = await fetchRecentRoasts();
      if (error) throw new Error(error);
      return roasts;
    },
  });

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
          <Link href="/dashboard/repos">
            <Button
              className="h-10 font-semibold uppercase"
              disabled={is_loading_repos}
            >
              <PlusIcon strokeWidth={4} className="mr-2" /> Link More Trash
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egos Bruised</CardTitle>
            <Flame size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {is_loading_stats ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : is_error_stats ? (
              <div className="text-xs text-destructive">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.egos_bruised || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total code autopsies performed.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tears (Litres)
            </CardTitle>
            <TrendUpIcon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {is_loading_stats ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : is_error_stats ? (
              <div className="text-xs text-destructive">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.total_violations || 0) * 0.1}L
                </div>
                <p className="text-xs text-muted-foreground">
                  Derived from cumulative code violations.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Objective Garbage
            </CardTitle>
            <WarningIcon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {is_loading_stats ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : is_error_stats ? (
              <div className="text-xs text-destructive">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.active_repos || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active repositories under analysis.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hostages (Repos)
            </CardTitle>
            <GithubLogoIcon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {is_loading_repos ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : is_error_repos ? (
              <div className="text-xs text-destructive">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{linked_repos.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total repositories linked to account.
                </p>
              </>
            )}
          </CardContent>
        </Card>
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
          <CardContent
            className={cn(
              'min-h-[300px] flex flex-col items-center p-6 text-center border-t border-border/50',
              recent_roasts.length === 0 ? 'border-t-0 justify-center' : ''
            )}
          >
            {is_loading_roasts ? (
              <div className="w-full space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : is_error_roasts ? (
              <div className="flex flex-col items-center">
                <WarningOctagonIcon
                  size={32}
                  className="text-destructive mb-2"
                />
                <p className="text-destructive font-bold">
                  Failed to load roast history.
                </p>
              </div>
            ) : recent_roasts.length === 0 ? (
              <>
                <div className="rounded-full bg-muted p-4 mb-4">
                  <GhostIcon size={32} className="text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">No victims found</h3>
                <p className="text-muted-foreground text-sm max-w-[250px] mt-2 mb-6">
                  It seems you haven&apos;t submitted any PRs for me to destroy
                  yet.
                </p>
                <Button variant="outline" className="uppercase font-bold">
                  Submit Code
                </Button>
              </>
            ) : (
              <div className="w-full space-y-4">
                {recent_roasts.map((roast) => (
                  <div
                    key={roast.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm">{roast.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {roast.repo_name} •{' '}
                        {new Date(roast.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold ${
                          roast.roast_score >= 7
                            ? 'text-green-500'
                            : 'text-destructive'
                        }`}
                      >
                        {roast.roast_score}/10
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/repos/${roast.repo_name}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle>Victim List</CardTitle>
            <CardDescription>
              Codebases I currently have to look at.
            </CardDescription>
          </CardHeader>
          <CardContent
            className={
              linked_repos.length > 0
                ? 'p-0'
                : 'min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-t border-border/50'
            }
          >
            {is_loading_repos ? (
              <div className="w-full space-y-6 p-6">
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
            ) : is_error_repos ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <WarningOctagonIcon
                  size={32}
                  className="text-destructive mb-2"
                />
                <p className="text-destructive font-bold">
                  Failed to load victims.
                </p>
              </div>
            ) : linked_repos.length > 0 ? (
              <div className="divide-y divide-border">
                {linked_repos.slice(0, 5).map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 rounded-md border">
                      <AvatarImage src="/github-icon.png" />
                      <AvatarFallback className="rounded-md">GH</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{repo.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {repo.language || 'Unknown'}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/dashboard/repos/${repo.name}`}>
                        <GithubLogoIcon />
                      </Link>
                    </Button>
                  </div>
                ))}
                {linked_repos.length > 5 && (
                  <div className="p-4 text-center">
                    <Link
                      href="/dashboard/repos"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      View all {linked_repos.length} repos
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-full bg-muted p-4 mb-4">
                  <GithubLogoIcon size={32} className="text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">No Repos Connected</h3>
                <p className="text-muted-foreground text-sm max-w-[200px] mt-2 mb-6">
                  Connect a repository so I can complain.
                </p>
                <Link href="/dashboard/repos">
                  <Button className="uppercase font-bold">Connect Repo</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
