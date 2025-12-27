"use client"

import { 
  GithubLogo, 
  GitBranch, 
  Eye, 
  Skull, 
  Lock, 
  DotsThreeCircle, 
  DotsThreeIcon
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

export interface Repository {
  name: string
  description: string
  language: string
  stars: string
  forks: string
  watchers: string
  updatedAt: string
  status: "Running" | "Paused"
  private: boolean
  pendingMurders: number
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export function RepoCard({ repo }: { repo: Repository }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="flex flex-col justify-between border-muted-foreground/20 h-full">
        <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-4 space-y-0 px-5">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Avatar className="size-8 rounded-none">
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
       
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size- p-0">
                  <span className="sr-only">Open menu</span>
                  <DotsThreeIcon weight="bold" className="text-muted-foreground rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Regrettable Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/repos/${repo.name}`} className="flex items-center cursor-pointer font-semibold">
                  Examine Failures
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Copy Shame ID</DropdownMenuItem>
                <DropdownMenuItem>View Crime Scene (GitHub)</DropdownMenuItem>
                <DropdownMenuItem>Change Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 font-bold text-xs uppercase">Erase from Existence</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
    
        </CardHeader>
        <CardContent className="space-y-4 px-5">
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="mr-1 h-3 w-3 rounded-full bg-sky-500" />
              {repo.language}
            </div>
            <div className="flex items-center italic">
              Ruined {repo.updatedAt}
            </div>
            <div className="flex items-center">
              <GithubLogo size={16} weight="bold" className="mr-1" />
              {repo.forks}
            </div>
            <div className="flex items-center">
              <GitBranch size={16} weight="bold" className="mr-1" />
              {repo.watchers}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-destructive font-bold text-sm cursor-help">
                  <Skull size={18} weight="fill" />
                  <span>{repo.pendingMurders} Pending Murders</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pull Requests waiting to be roasted</p>
              </TooltipContent>
            </Tooltip>
            <Badge 
              variant={repo.status === 'Running' ? 'default' : 'secondary'} 
              className={repo.status === 'Running' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'}
            >
              {repo.status === 'Running' ? 'Running' : 'Paused'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}