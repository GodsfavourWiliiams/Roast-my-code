"use client"

import {
  Skull,
  Lock,
} from '@phosphor-icons/react/dist/ssr';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Repository } from '@/lib/types';
import { updateRepoStatus, deleteRepo } from '@/app/actions/github';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export function RepoCard({ repo }: { repo: Repository }) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const router = useRouter();

  const { mutate: toggleStatus, isPending: isStatusPending } = useMutation({
    mutationFn: async () => {
      if (!repo.id) throw new Error('Repo ID missing');
      const newStatus = repo.status === 'Running' ? 'Paused' : 'Running';
      const result = await updateRepoStatus(repo.id, newStatus);
      if (result.error) throw new Error(result.error);
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast.success(
        `Repository ${newStatus === 'Running' ? 'resumed' : 'paused'}.`
      );
      queryClient.invalidateQueries({ queryKey: ['savedRepos'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const { mutate: deleteRepository, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!repo.id) throw new Error('Repo ID missing');
      const result = await deleteRepo(repo.id);
      if (result.error) throw new Error(result.error);
      return repo.name;
    },
    onSuccess: (name) => {
      toast.success(`${name} has been erased from existence.`);
      queryClient.invalidateQueries({ queryKey: ['savedRepos'] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete repo: ${error.message}`);
    },
  });

  const handleCopyId = () => {
    if (repo.id) {
      navigator.clipboard.writeText(repo.id.toString());
      toast.success('Shame ID copied to clipboard.');
    } else {
      toast.error('ID missing.');
    }
  };

  const getFrameworkIcon = (repo: Repository) => {
    if (repo.framework) {
      switch (repo.framework) {
        case 'Next.js': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg';
        case 'React': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg';
        case 'Vue': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg';
        case 'Nuxt': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxt-original.svg';
        case 'Angular': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg';
        case 'Svelte': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg';
        case 'NestJS': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg';
        case 'Express': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg';
        case 'Python': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg';
        case 'Java': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg';
        case 'Go': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg';
        case 'Rust': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg';
        case 'TypeScript': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg';
        case 'JavaScript': return 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg';
      }
    }
    return '/github-icon.png';
  };

  const avatarSrc = getFrameworkIcon(repo);

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Card 
        className="flex h-full flex-col border-muted-foreground/20 hover:border-primary/50 transition-colors duration-300 cursor-pointer"
        onClick={() => router.push(`/dashboard/repos/${repo.name}`)}
      >
        <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4 space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Avatar className="h-6 w-6 rounded-none border border-transparent bg-transparent">
                <AvatarImage
                  src={avatarSrc}
                  className={avatarSrc.includes('nextjs') ? 'dark:invert' : ''}
                />
                <AvatarFallback>GH</AvatarFallback>
              </Avatar>
              <span className="truncate">{repo.name}</span>
              {repo.private && <Lock size={12} weight="bold" className="text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {repo.description}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={repo.status === 'Running' ? 'default' : 'secondary'}
              className={`cursor-pointer select-none transition-colors ${
                repo.status === 'Running'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isStatusPending) toggleStatus();
              }}
            >
              {repo.status === 'Running' ? 'Running' : 'Paused'}
            </Badge>

            {/* Dropdown - Fixed Click Propagation */}
            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    >
                    <span className="sr-only">Open menu</span>
                    <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Regrettable Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => !isStatusPending && toggleStatus()}
                        disabled={isStatusPending}
                    >
                        {repo.status === 'Running' ? 'Pause Analysis' : 'Resume Analysis'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onSelect={() => router.push(`/dashboard/repos/${repo.name}`)}
                        className="font-bold"
                    >
                        Examine Failures
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleCopyId}>
                        Copy Shame ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => window.open(`https://github.com/${repo.full_name}`, '_blank')}>
                        View Crime Scene (GitHub)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => setDeleteDialogOpen(true)}
                        className="text-red-600 font-bold text-xs uppercase focus:text-red-600 focus:bg-red-50"
                    >
                        Erase from Existence
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title="Are you absolutely sure?"
              description={`This action cannot be undone. This will permanently delete ${repo.name} and all its roast history from our servers.`}
              confirmText={isDeleting ? 'Erasing...' : 'Yes, Erase It'}
              variant="destructive"
              onConfirm={() => deleteRepository()}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-sky-500" />
                {repo.language}
              </div>
            </div>
            <div className="italic text-xs">Ruined {repo.updated_at}</div>
          </div>

          <div 
            className="flex items-center bg-muted/50 p-2 rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-destructive font-bold text-sm cursor-help hover:underline w-full justify-center">
                  <Skull size={18} weight="fill" />
                  <span>{repo.pending_murders} Pending Murders</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pull Requests waiting to be roasted</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
