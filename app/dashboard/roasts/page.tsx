"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  GitCommitIcon, 
  FlameIcon, 
  ArrowRightIcon,
  CalendarBlankIcon,
  TagIcon,
  GhostIcon,
  WarningOctagonIcon
} from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGlobalRoastHistory, GlobalRoast } from '@/app/actions/roasts';
import { MarkdownRenderer } from '@/components/markdown-renderer';

// Simple Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function RoastsPage() {
  const [filter, setFilter] = useState('all');
  const [selectedRoast, setSelectedRoast] = useState<GlobalRoast | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // useQuery now tracks debouncedSearch and filter as keys,
  // triggering a server-side fetch whenever they change.
  const {
    data: roasts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['globalRoasts', debouncedSearch, filter],
    queryFn: async () => {
      const { roasts, error } = await getGlobalRoastHistory({
        search: debouncedSearch,
        filter,
      });
      if (error) throw new Error(error);
      return roasts;
    },
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 },
  };

  if (isError) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
          <WarningOctagonIcon
            size={64}
            className="text-destructive animate-pulse"
          />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-destructive mb-2">
          System Failure
        </h2>
        <p className="max-w-md text-muted-foreground mb-6">
          &gt; Error: Database connection unstable. <br />
          &gt; Status: Your failure history is too heavy to load.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="font-mono"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          The Wall of Shame
        </h1>
        <p className="text-muted-foreground">
          Permanent receipts of every time you thought &quot;it works on my
          machine&quot;.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={16}
            weight="bold"
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <Input
            placeholder="Search by repo or PR title..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FunnelIcon size={16} weight="bold" />
              Filter Severity
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Roast Intensity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filter === 'all'}
              onCheckedChange={() => setFilter('all')}
            >
              All Disasters
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter === 'nuclear'}
              onCheckedChange={() => setFilter('nuclear')}
            >
              Nuclear (Score 0-3)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter === 'painful'}
              onCheckedChange={() => setFilter('painful')}
            >
              Painful (Score 4-7)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter === 'nitpick'}
              onCheckedChange={() => setFilter('nitpick')}
            >
              Nitpick (Score 8-10)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-8 md:pl-0">
              <Card className="border-2 border-muted">
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : roasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5">
          <div className="rounded-full bg-muted p-6 mb-6">
            <GhostIcon size={48} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            No History of Violence... Yet
          </h2>
          <p className="text-muted-foreground max-w-md text-center mb-8">
            Your record is clean. Suspiciously clean. Submit a PR to start
            filling this graveyard.
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <Sheet>
            {roasts.map((roast) => (
              <motion.div
                key={roast.id}
                variants={item}
                className="relative pl-8 md:pl-0"
              >
                <div className="hidden md:block absolute -left-8 top-0 -bottom-4 w-px  ml-9"></div>
                <div className="hidden md:flex absolute -left-8 top-6 h-4 w-4 rounded-full bg-background border-2 border-primary items-center justify-center z-10 ml-[1.8rem]">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>

                <Card className="hover:border-primary/50 transition-colors border-2">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Meta */}
                      <div className="w-full md:w-48 shrink-0 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary">
                          <GitCommitIcon size={16} weight="bold" />
                          <span className="font-mono text-xs uppercase">
                            Roast #{roast.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarBlankIcon size={14} />{' '}
                          {new Date(roast.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TagIcon size={14} /> {roast.repo_name}
                        </div>
                      </div>

                      {/* Right: Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg truncate">
                              {roast.pr_title || 'Untitled Roast'}
                            </h3>
                            <div className="text-sm text-muted-foreground line-clamp-2 mt-1 italic">
                              {roast.roast_content.substring(0, 150)}...
                            </div>
                          </div>
                          <div className="flex flex-col items-center shrink-0 border-2 border-destructive/20 p-2 rounded-md bg-destructive/5">
                            <span className="text-xl font-black text-destructive">
                              {roast.roast_score ?? '?'}
                            </span>
                            <span className="text-[8px] uppercase font-black text-destructive tracking-widest">
                              Score
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <SheetTrigger
                            asChild
                            onClick={() => setSelectedRoast(roast)}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-primary font-bold hover:bg-primary/10"
                            >
                              Read Full Autopsy{' '}
                              <ArrowRightIcon size={16} weight="bold" />
                            </Button>
                          </SheetTrigger>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            <SheetContent className="sm:max-w-2xl overflow-y-auto">
              {selectedRoast && (
                <div className="space-y-8 py-6">
                  <SheetHeader className="space-y-4 border-b p-4 text-left">
                    <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-widest">
                      <GitCommitIcon size={18} weight="bold" />
                      Roast ID: {selectedRoast.id}
                    </div>
                    <SheetTitle className="text-2xl font-black uppercase tracking-tighter leading-none">
                      {selectedRoast.pr_title || 'Manual Roast'}
                    </SheetTitle>
                    <SheetDescription className="text-base font-medium">
                      Conducted on{' '}
                      {new Date(selectedRoast.created_at).toLocaleString()} for{' '}
                      <span className="text-foreground font-bold">
                        {selectedRoast.repo_name}
                      </span>
                    </SheetDescription>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="bg-destructive/10 border-2 border-destructive rounded-sm p-3 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-destructive">
                          {selectedRoast.roast_score ?? '?'}
                        </span>
                        <span className="text-[8px] font-bold uppercase text-destructive tracking-widest">
                          Score
                        </span>
                      </div>
                      <div className="bg-orange-500/10 border-2 border-orange-500 rounded-sm p-3 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-orange-500">
                          {selectedRoast.critical_issues_count}
                        </span>
                        <span className="text-[8px] font-bold uppercase text-orange-500 tracking-widest">
                          Critical
                        </span>
                      </div>
                      <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-sm p-3 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-yellow-500">
                          {selectedRoast.violations_count}
                        </span>
                        <span className="text-[8px] font-bold uppercase text-yellow-500 tracking-widest">
                          Violations
                        </span>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="space-y-3 px-6">
                    <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <FlameIcon
                        size={18}
                        weight="fill"
                        className="text-primary"
                      />{' '}
                      Senior Dev&apos;s Review
                    </h4>
                    <div className="bg-muted/30 p-4 text-sm rounded-lg border border-border/50">
                      <MarkdownRenderer content={selectedRoast.roast_content} />
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </motion.div>
      )}
    </div>
  );
}