'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  WarningOctagon,
  CircleNotch,
  Lock,
  Globe,
  GitBranch,
  CircleNotchIcon,
} from '@phosphor-icons/react/dist/ssr';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { RepoCard } from '@/components/repo-card';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  fetchGithubRepos,
  saveRepo,
  getSavedRepos,
  SavedRepo,
} from '@/app/actions/github';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Repository, GithubRepo } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Simple Debounce Hook Implementation
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function ReposPage() {
  const [filter, setFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  // Search states
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const debouncedModalSearch = useDebounceValue(modalSearchQuery, 500);

  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const debouncedDashboardSearch = useDebounceValue(dashboardSearchQuery, 500);

  const [importingId, setImportingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Query for saved repositories (Server-side search & filter)
  const {
    data: savedReposData,
    isLoading: isLoadingSaved,
    isError: isErrorSaved,
  } = useQuery({
    queryKey: ['savedRepos', debouncedDashboardSearch, filter],
    queryFn: async () => {
      const { repos, error } = await getSavedRepos({
        search: debouncedDashboardSearch,
        filter,
      });
      if (error) throw new Error(error);
      return repos;
    },
  });

  // Query for GitHub repositories (Standard list, max 20)
  const {
    data: githubRepos,
    isLoading: isLoadingGithub,
    isError: isErrorGithub,
    error: githubError,
  } = useQuery({
    queryKey: ['githubRepos', debouncedModalSearch],
    queryFn: async () => {
      const { repos, error } = await fetchGithubRepos({
        search: debouncedModalSearch,
      });
      if (error) throw new Error(error);
      return repos;
    },
    enabled: isOpen,
  });
  console.log(githubRepos);
  // Mutation for saving a repository
  const { mutate: importRepo, isPending: isImporting } = useMutation({
    mutationFn: async (repo: GithubRepo) => {
      setImportingId(repo.id);
      const { error } = await saveRepo(repo);
      if (error) throw new Error(error);
      return repo;
    },
    onSuccess: (repo) => {
      toast.success(`${repo.name} added to the kill list.`);
      queryClient.invalidateQueries({ queryKey: ['savedRepos'] });
      setIsOpen(false);
      setImportingId(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to import: ${error.message}`);
      setImportingId(null);
    },
  });

  const repositories: Repository[] =
    savedReposData?.map((r: SavedRepo) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description || 'No description provided (lazy).',
      language: r.language || 'Unknown',
      framework: r.framework,
      stars: '0',
      forks: '0',
      watchers: '0',
      updated_at: new Date(r.updated_at).toLocaleDateString(),
      status: r.status,
      private: r.private,
      pending_murders: r.open_prs_count || 0,
    })) || [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (isErrorSaved) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
          <WarningOctagon
            size={64}
            className="text-destructive animate-pulse"
          />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-destructive mb-2">
          Graveyard Offline
        </h2>
        <p className="max-w-md text-muted-foreground mb-6">
          &gt; Error: Fail to retrieve victim list. <br />
          &gt; Status: 500 - Internal Rage.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">The Cemetery</h1>
          <p className="text-muted-foreground">
            A graveyard of codebases that I&apos;ve had the misfortune of
            reading.
          </p>
        </div>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setModalSearchQuery(''); // Reset search on close
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  className="uppercase font-bold"
                  disabled={isLoadingSaved}
                >
                  <PlusIcon size={16} weight="bold" className="mr-2" /> Import
                  More Junk
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connect a new repository to be roasted</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent className="sm:max-w-[500px] h-[500px] flex flex-col p-0 gap-0 overflow-hidden bg-background">
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle>Import Git Repository</DialogTitle>
              <DialogDescription>
                Select a repository to import.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-2 shrink-0">
              <div className="relative">
                <MagnifyingGlassIcon
                  size={16}
                  weight="bold"
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <Input
                  placeholder="Search your repositories..."
                  className="pl-9"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6 pt-2 space-y-1">
                  {isLoadingGithub ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-md border border-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))
                  ) : isErrorGithub ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-destructive mb-2 font-bold">
                        Failed to load repositories.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {githubError?.message}
                      </p>
                    </div>
                  ) : githubRepos?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>
                        No repositories found matching &quot;
                        {debouncedModalSearch}&quot;.
                      </p>
                    </div>
                  ) : (
                    <>
                      {githubRepos?.map((repo) => (
                        <div
                          key={repo.id}
                          className="group flex items-center justify-between p-3 rounded-md border border-transparent hover:border-border hover:bg-muted/30 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center border border-border">
                              {repo.private ? (
                                <Lock size={18} weight="bold" />
                              ) : (
                                <Globe size={18} />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm truncate">
                                  {repo.name}
                                </span>
                                {repo.private && (
                                  <Lock
                                    size={12}
                                    weight="fill"
                                    className="text-muted-foreground shrink-0"
                                  />
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {repo.updated_at && (
                                  <span>
                                    Last updated{' '}
                                    {new Date(
                                      repo.updated_at
                                    ).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => importRepo(repo)}
                            disabled={isImporting}
                            variant="secondary"
                            className="h-8 text-xs font-bold uppercase tracking-wider"
                          >
                            {importingId === repo.id ? (
                              <CircleNotchIcon className="animate-spin" />
                            ) : (
                              'Import'
                            )}
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative w-fit">
          <MagnifyingGlassIcon
            size={16}
            weight="bold"
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search for specific trash..."
            className="pl-8 max-w-md w-full h-10"
            disabled={isLoadingSaved}
            value={dashboardSearchQuery}
            onChange={(e) => setDashboardSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 w-full md:w-auto rounded h-10 justify-center"
              disabled={isLoadingSaved}
            >
              <FunnelIcon size={16} weight="bold" />
              Filter by Odor
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filter === 'all'}
              onCheckedChange={() => setFilter('all')}
            >
              All Smells
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter === 'running'}
              onCheckedChange={() => setFilter('running')}
            >
              Active Fires (Running)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter === 'paused'}
              onCheckedChange={() => setFilter('paused')}
            >
              Cold Ashes (Paused)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoadingSaved ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-2">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : repositories.length > 0 ? (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {repositories.map((repo) => (
            <RepoCard key={repo.name} repo={repo} />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5">
          <div className="rounded-full bg-muted p-6 mb-6">
            <TrashIcon size={48} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Repositories Found</h2>
          <p className="text-muted-foreground max-w-md text-center mb-8">
            Your dashboard is surprisingly clean. Too clean. Add a repository so
            I can find something to complain about.
          </p>
          <Button
            onClick={() => setIsOpen(true)}
            className="uppercase font-bold tracking-wide"
          >
            <PlusIcon weight="bold" className="mr-2" />
            Add First Victim
          </Button>
        </div>
      )}
    </div>
  );
}
