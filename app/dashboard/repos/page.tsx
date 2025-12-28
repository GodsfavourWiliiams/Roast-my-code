'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  GithubLogo,
  Trash,
  WarningOctagon,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { RepoCard, Repository } from '@/components/repo-card';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function ReposPage() {
  const [filter, setFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRepositories([]); // Empty state by default
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredRepos = repositories.filter((repo) => {
    if (filter === 'all') return true;
    if (filter === 'running') return repo.status === 'Running';
    if (filter === 'paused') return repo.status === 'Paused';
    return true;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (error) {
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

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button className="uppercase font-bold" disabled={isLoading}>
                  <PlusIcon size={16} weight="bold" className="mr-2" /> Import
                  More Junk
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connect a new repository to be roasted</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Import Repository</DialogTitle>
              <DialogDescription>
                Paste the URL of the GitHub repository you want us to tear
                apart.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  Repo URL
                </Label>
                <Input
                  id="url"
                  placeholder="https://github.com/user/trash-repo"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={() => setIsOpen(false)}
                className="uppercase font-bold"
              >
                Analyze & Destroy
              </Button>
            </DialogFooter>
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
            disabled={isLoading}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 w-full md:w-auto rounded h-10 justify-center"
              disabled={isLoading}
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

      {isLoading ? (
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
      ) : filteredRepos.length > 0 ? (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredRepos.map((repo) => (
            <RepoCard key={repo.name} repo={repo as Repository} />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Trash size={48} className="text-muted-foreground opacity-50" />
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
