"use client"

import { 
  GithubLogo, 
  GitBranch, 
  Eye, 
  Skull, 
  Lock, 
  DotsThreeCircle, 
  DotsThreeIcon,
  CircleNotch
} from "@phosphor-icons/react/dist/ssr"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"
import { motion } from "framer-motion"
import { MenuIcon } from "lucide-react"
import { Repository } from "@/lib/types"
import { updateRepoStatus, deleteRepo } from "@/app/actions/github"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export function RepoCard({ repo }: { repo: Repository }) {
  const queryClient = useQueryClient();

  const { mutate: toggleStatus, isPending: isStatusPending } = useMutation({
    mutationFn: async () => {
        if (!repo.id) throw new Error("Repo ID missing");
        const newStatus = repo.status === 'Running' ? 'Paused' : 'Running';
        const result = await updateRepoStatus(repo.id, newStatus);
        if (result.error) throw new Error(result.error);
        return newStatus;
    },
    onSuccess: (newStatus) => {
        toast.success(`Repository ${newStatus === 'Running' ? 'resumed' : 'paused'}.`);
        queryClient.invalidateQueries({ queryKey: ['savedRepos'] });
    },
    onError: (error: Error) => {
        toast.error(`Failed to update status: ${error.message}`);
    }
  });

  const { mutate: deleteRepository, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
        if (!repo.id) throw new Error("Repo ID missing");
        const result = await deleteRepo(repo.id);
        if (result.error) throw new Error(result.error);
        return repo.name;
    },
    onSuccess: (name) => {
        toast.success(`${name} has been erased from existence.`);
        queryClient.invalidateQueries({ queryKey: ['savedRepos'] });
    },
    onError: (error: Error) => {
        toast.error(`Failed to delete repo: ${error.message}`);
    }
  });

  const handleCopyId = () => {
    if (repo.id) {
        navigator.clipboard.writeText(repo.id.toString());
        toast.success("Shame ID copied to clipboard.");
    } else {
        toast.error("ID missing.");
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="flex flex-col border-muted-foreground/20 hover:border-primary/50 transition-colors duration-300">
        <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4 space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Avatar className="h-6 w-6 rounded-none border border-border">
                <AvatarImage src="/github-icon.png" />
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
              onClick={() => !isStatusPending && toggleStatus()}
            >
              {isStatusPending ? <CircleNotch className="animate-spin mr-1" size={12} /> : null}
              {repo.status === 'Running' ? 'Running' : 'Paused'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <DotsThreeCircle size={24} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Regrettable Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleStatus()} disabled={isStatusPending}>
                   {repo.status === 'Running' ? 'Pause Analysis' : 'Resume Analysis'}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/repos/${repo.name}`} className="flex items-center cursor-pointer font-bold">
                    <Eye size={16} className="mr-2" /> Examine Failures
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyId}>
                    Copy Shame ID
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href={`https://github.com/${repo.name}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                        View Crime Scene (GitHub)
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                    Change Settings <span className="ml-2 text-[10px] text-muted-foreground">(Coming Soon)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={() => deleteRepository()} 
                    disabled={isDeleting}
                    className="text-red-600 font-bold text-xs uppercase focus:text-red-600 focus:bg-red-50"
                >
                    {isDeleting ? "Erasing..." : "Erase from Existence"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
             <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="mr-1 h-3 w-3 rounded-full bg-sky-500" />
                  {repo.language}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center">
                    <GithubLogo size={16} weight="bold" className="mr-1" />
                    {repo.forks}
                    </div>
                    <div className="flex items-center">
                    <GitBranch size={16} weight="bold" className="mr-1" />
                    {repo.watchers}
                    </div>
                </div>
             </div>
             <div className="italic text-xs">
              Ruined {repo.updatedAt}
            </div>
          </div>
          
          <div className="flex items-center bg-muted/50 p-2 rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-destructive font-bold text-sm cursor-help hover:underline w-full justify-center">
                  <Skull size={18} weight="fill" />
                  <span>{repo.pendingMurders} Pending Murders</span>
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
  )
}