'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft as ArrowLeftIcon, 
  GitPullRequest as GitPullRequestIcon, 
  Skull as SkullIcon, 
  Warning as WarningIcon, 
  CheckCircle as CheckCircleIcon, 
  WarningOctagon as WarningOctagonIcon, 
  CircleNotch as CircleNotchIcon, 
  Fire as FireIcon, 
  CaretDown as CaretDownIcon, 
  CalendarBlank as CalendarBlankIcon, 
  BookOpen as BookOpenIcon,
  Star as StarIcon,
  GitFork as GitForkIcon,
  Eye as EyeIcon,
  DotsThreeCircle as DotsThreeCircleIcon,
  Trash as TrashIcon,
  GithubLogo as GithubLogoIcon,
  Globe as GlobeIcon,
  Lock as LockIcon,
  ArrowsClockwise as ArrowsClockwiseIcon
} from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRepoDetails } from '@/app/actions/repo-details';
import { Skeleton } from '@/components/ui/skeleton';
import { use, useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ManualRoastDialog } from '@/components/manual-roast-dialog';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { updateRepoStatus, deleteRepo } from '@/app/actions/github';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

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
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  // Actions
  const { mutate: toggleStatus, isPending: isStatusPending } = useMutation({
    mutationFn: async () => {
      if (!repoDetails?.id) throw new Error('Repo ID missing');
      const newStatus = repoDetails.status === 'Running' ? 'Paused' : 'Running';
      const result = await updateRepoStatus(repoDetails.id, newStatus);
      if (result.error) throw new Error(result.error);
      return newStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repoDetails', decodedName] });
      toast.success("Status updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  });

  const { mutate: deleteRepository, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!repoDetails?.id) throw new Error('Repo ID missing');
      const result = await deleteRepo(repoDetails.id);
      if (result.error) throw new Error(result.error);
      return repoDetails.name;
    },
    onSuccess: () => {
      toast.success("Erased from existence.");
      router.push('/dashboard/repos');
    }
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
        <Link href={ROUTES.DASHBOARD.REPOS}>
          <Button variant="outline">Return to Cemetery</Button>
        </Link>
      </div>
    );
  }

  const getFrameworkIcon = () => {
    if (repoDetails.framework) {
      switch (repoDetails.framework) {
        case 'Next.js': return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg";
        case 'React': return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg";
        case 'Vue': return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg";
        case 'Angular': return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg";
      }
    }
    return "/github-icon.png";
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header with Actions */}
      <div className="flex flex-col gap-6 border-b pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                <Link href={ROUTES.DASHBOARD.REPOS} className="mt-1">
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                        <ArrowLeftIcon size={20} weight="bold" />
                    </Button>
                </Link>
                <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold tracking-tight truncate">{repoDetails.name}</h1>
                        <Badge
                            variant={repoDetails.status === 'Running' ? 'default' : 'secondary'}
                            className={`transition-colors ${
                                repoDetails.status === 'Running' ? 'bg-green-500 hover:bg-green-600' : 
                                repoDetails.status === 'Idle' ? 'bg-blue-500/10 text-blue-600' : 
                                'bg-yellow-500/10 text-yellow-600'
                            }`}
                        >
                            {repoDetails.status}
                        </Badge>
                        {repoDetails.private ? <LockIcon size={16} weight="bold" className="text-muted-foreground" /> : <GlobeIcon size={16} weight="bold" className="text-muted-foreground" />}
                    </div>
                    <div className="relative">
                        <p className="text-muted-foreground mt-1 max-w-2xl line-clamp-1 pr-4">{repoDetails.description || 'No description provided.'}</p>
                        {repoDetails.description && repoDetails.description.length > 70 && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="h-auto p-0 text-xs text-primary mt-1">
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

            <div className="flex items-center gap-2">
                <ManualRoastDialog repoName={repoDetails.full_name} repoId={repoDetails.id} />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <DotsThreeCircleIcon size={24} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Management</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => toggleStatus()} disabled={isStatusPending}>
                            {repoDetails.status === 'Running' ? 'Pause Analysis' : 'Start Analysis'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => window.open(`https://github.com/${repoDetails.full_name}`, '_blank')}>
                            View on GitHub
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(repoDetails.id.toString())}>
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onSelect={(e) => { e.preventDefault(); setDeleteDialogOpen(true); }}
                            className="text-destructive font-bold"
                        >
                            Erase from Existence
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {/* Quick Meta Stats */}
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <GithubLogoIcon size={18} />
                <span className="font-mono">{repoDetails.full_name}</span>
            </div>
            <div className="flex items-center gap-2 text-primary font-medium border-x px-6 border-border/50">
                <img src={getFrameworkIcon()} className="w-4 h-4" alt="tech" />
                {repoDetails.framework || repoDetails.language}
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><StarIcon size={16} /> {repoDetails.stars_count || 0}</div>
                <div className="flex items-center gap-1.5"><GitForkIcon size={16} /> {repoDetails.forks_count || 0}</div>
                <div className="flex items-center gap-1.5"><EyeIcon size={16} /> {repoDetails.watchers_count || 0}</div>
            </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-destructive flex items-center gap-2">
              <SkullIcon size={28} weight="fill" /> {repoDetails.stats.total_violations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Crimes detected in code history</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-500 flex items-center gap-2">
              <WarningIcon size={28} weight="fill" /> {repoDetails.stats.critical_issues}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Disastrous logical or security bugs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Survival Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500 flex items-center gap-2">
              <CheckCircleIcon size={28} weight="fill" /> {repoDetails.stats.survival_rate === -1 ? 'N/A' : `${repoDetails.stats.survival_rate}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">PRs that passed with a high score</p>
          </CardContent>
        </Card>
      </div>

      {/* Roast History */}
      <Card className="overflow-hidden border-2 shadow-sm">
        <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <GitPullRequestIcon weight="bold" size={20} /> Roast History
                </CardTitle>
                <CardDescription>A timeline of your engineering failures.</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">{repoDetails.roasts.length} Reports</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {repoDetails.roasts.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {repoDetails.roasts.map((roast) => (
                <AccordionItem key={roast.id} value={`item-${roast.id}`} className="border-b last:border-0 px-6">
                  <AccordionTrigger className="hover:no-underline py-5 group">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-lg group-hover:text-primary transition-colors">
                          {roast.pr_title || `PR #${roast.pr_number}`}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
                          <CalendarBlankIcon />
                          {new Date(roast.created_at).toLocaleDateString(undefined, { 
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                        <span className={`text-xl font-black leading-none ${roast.roast_score && roast.roast_score >= 7 ? "text-green-500" : "text-destructive"}`}>
                            {roast.roast_score}/10
                        </span>
                        <span className="text-[8px] uppercase font-bold tracking-tighter opacity-50">Verdict Score</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="bg-card rounded-md p-6 border border-border/50 shadow-sm">
                      <MarkdownRenderer content={roast.roast_content} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground bg-muted/5">
              <div className="bg-muted rounded-full p-6 mb-4">
                <CheckCircleIcon size={40} className="text-muted-foreground/30" />
              </div>
              <p className="font-bold text-lg text-foreground">Clean Record Detected</p>
              <p className="text-sm max-w-xs mt-1">Submit a PR or start a manual autopsy to begin your journey of shame.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
        title="Delete this repository?"
        description={`This will erase ${repoDetails.name} and all associated roast data forever. This action is irreversible.`}
        confirmText={isDeleting ? "Deleting..." : "Erase from Existence"}
        variant="destructive"
        onConfirm={() => deleteRepository()}
      />
    </div>
  );
}