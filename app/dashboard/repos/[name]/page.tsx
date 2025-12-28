'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeftIcon,
  GitPullRequestIcon,
  SkullIcon,
  WarningIcon,
  CheckCircleIcon,
  WarningOctagonIcon,
  CalendarBlankIcon,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getRepoDetails } from '@/app/actions/repo-details';
import { Skeleton } from '@/components/ui/skeleton';
import { use } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ManualRoastDialog } from '@/components/manual-roast-dialog';
import { MarkdownRenderer } from '@/components/markdown-renderer';

// Explanation of "Roast Manually":
// Normally, the bot waits for a GitHub Webhook (Pull Request).
// "Manual Roast" allows the user to paste a snippet or select a file *right now*
// to get instant feedback without needing to push code to GitHub.

export default function RepoDetailsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  return <RepoDetailsContent params={params} />;
}

function RepoDetailsContent({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const decodedName = decodeURIComponent(name);

  const {
    data: repoDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['repoDetails', decodedName],
    queryFn: async () => {
      const { data, error } = await getRepoDetails(decodedName);
      if (error) throw new Error(error);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-10 pt-6">
        <div className="flex items-center gap-4 border-b pb-6">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !repoDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <WarningOctagonIcon
          size={64}
          className="text-destructive animate-pulse mb-4"
        />
        <h2 className="text-2xl font-bold mb-2">Autopsy Failed</h2>
        <p className="text-muted-foreground mb-6">
          Could not retrieve data for{' '}
          <span className="font-mono font-bold text-foreground">
            {decodedName}
          </span>
          .
          <br />
          {error?.message || 'The repository might have been deleted or moved.'}
        </p>
        <Link href="/dashboard/repos">
          <Button variant="outline">Return to Cemetery</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-start gap-4 max-w-2xl">
          <Link href="/dashboard/repos" className="mt-1">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeftIcon size={20} weight="bold" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 truncate">
              {repoDetails.name}
              <Badge
                variant={repoDetails.private ? 'secondary' : 'outline'}
                className="ml-2 shrink-0"
              >
                {repoDetails.private ? 'Private' : 'Public'}
              </Badge>
            </h1>

            <div className="relative">
              <p className="text-muted-foreground line-clamp-1 pr-4">
                {repoDetails.description || 'No description provided.'}
              </p>
              {repoDetails.description &&
                repoDetails.description.length > 70 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-primary mt-1"
                      >
                        Read more
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Repository Description</DialogTitle>
                      </DialogHeader>
                      <DialogDescription className="mt-4 text-foreground leading-relaxed">
                        {repoDetails.description}
                      </DialogDescription>
                    </DialogContent>
                  </Dialog>
                )}
            </div>
          </div>
        </div>

        <ManualRoastDialog
          repoName={repoDetails.full_name}
          repoId={repoDetails.id}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive flex items-center gap-2">
              <SkullIcon size={24} weight="fill" />{' '}
              {repoDetails.stats.total_violations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Code crimes detected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 flex items-center gap-2">
              <WarningIcon size={24} weight="fill" />{' '}
              {repoDetails.stats.critical_issues}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Immediate refactor needed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Survival Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
              <CheckCircleIcon size={24} weight="fill" />{' '}
              {repoDetails.stats.survival_rate === -1
                ? 'N/A'
                : `${repoDetails.stats.survival_rate}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              PRs passed without roast
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roast History (Refactored) */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <GitPullRequestIcon weight="bold" /> Roast History
          </CardTitle>
          <CardDescription>A timeline of failure.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {repoDetails.roasts.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {repoDetails.roasts.map((roast) => (
                <AccordionItem
                  key={roast.id}
                  value={`item-${roast.id}`}
                  className="border-b last:border-0 px-6"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-base flex items-center gap-2">
                          {roast.pr_title || `PR #${roast.pr_number}`}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
                          <CalendarBlankIcon />
                          {new Date(roast.created_at).toLocaleDateString(
                            undefined,
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </div>
                      <Badge
                        variant={
                          roast.roast_score && roast.roast_score >= 8
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="ml-2 shrink-0"
                      >
                        Score: {roast.roast_score}/10
                      </Badge>
                    </div>
                  </AccordionTrigger>
                                              <AccordionContent>
                                                  <div className="bg-card rounded-md p-6 border border-border/50 shadow-sm">
                                                      <MarkdownRenderer content={roast.roast_content} />
                                                  </div>
                                              </AccordionContent>                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-muted/10">
              <div className="bg-muted rounded-full p-4 mb-4">
                <CheckCircleIcon
                  size={32}
                  className="text-muted-foreground/50"
                />
              </div>
              <p className="font-medium text-foreground">
                No roasts recorded yet.
              </p>
              <p className="text-sm max-w-xs mt-1">
                xwwSubmit a Pull Request or use the &quot;Roast Manually&quot;
                button to get your first review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
