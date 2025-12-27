"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MagnifyingGlass, 
  Plus, 
  Funnel
} from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { useState } from "react"
import { RepoCard, Repository } from "@/components/repo-card"

export default function ReposPage() {
  const [filter, setFilter] = useState("all")
  const [isOpen, setIsOpen] = useState(false)

  const filteredRepos = repositories.filter(repo => {
    if (filter === "all") return true
    if (filter === "running") return repo.status === "Running"
    if (filter === "paused") return repo.status === "Paused"
    return true
  })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">The Cemetery</h1>
          <p className="text-muted-foreground">
            A graveyard of codebases that I&apos;ve had the misfortune of reading.
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} weight="bold" className="mr-2" /> Import More Junk
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
                Paste the URL of the GitHub repository you want us to tear apart.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  Repo URL
                </Label>
                <Input id="url" placeholder="https://github.com/user/trash-repo" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsOpen(false)}>Analyze & Destroy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 md:max-w-sm">
            <MagnifyingGlass size={16} weight="bold" className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for specific trash..."
              className="pl-8"
            />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Funnel size={16} weight="bold" />
              Filter by Odor: {filter === "all" ? "All" : filter === "running" ? "Active Fires" : "Cold Ashes"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={filter === "all"} onCheckedChange={() => setFilter("all")}>
              All Smells
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filter === "running"} onCheckedChange={() => setFilter("running")}>
              Active Fires (Running)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filter === "paused"} onCheckedChange={() => setFilter("paused")}>
              Cold Ashes (Paused)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
    </div>
  )
}

const repositories = [
  {
    name: "frontend-v2",
    description: "The next generation frontend for our main application built with Next.js 15 and React Server Components.",
    language: "TypeScript",
    stars: "1.2k",
    forks: "142",
    watchers: "34",
    updatedAt: "2 hours ago",
    status: "Running",
    private: false,
    pendingMurders: 3
  },
  {
    name: "backend-api",
    description: "Scalable Node.js API gateway handling authentication, user management, and payments.",
    language: "JavaScript",
    stars: "845",
    forks: "92",
    watchers: "12",
    updatedAt: "1 day ago",
    status: "Running",
    private: true,
    pendingMurders: 12
  },
  {
    name: "legacy-monolith",
    description: "The old java codebase we are trying to strangle. Don't look at it directly.",
    language: "Java",
    stars: "45",
    forks: "12",
    watchers: "5",
    updatedAt: "1 month ago",
    status: "Paused",
    private: true,
    pendingMurders: 0
  },
  {
    name: "mobile-ios",
    description: "Native iOS application written in Swift. Needs a major refactor.",
    language: "Swift",
    stars: "230",
    forks: "45",
    watchers: "8",
    updatedAt: "3 days ago",
    status: "Running",
    private: true,
    pendingMurders: 5
  },
  {
    name: "infrastructure-iac",
    description: "Terraform modules and Kubernetes manifests for our cloud infrastructure.",
    language: "HCL",
    stars: "120",
    forks: "23",
    watchers: "10",
    updatedAt: "5 hours ago",
    status: "Running",
    private: true,
    pendingMurders: 1
  },
   {
    name: "design-system",
    description: "Shared component library and design tokens for all frontend applications.",
    language: "TypeScript",
    stars: "560",
    forks: "89",
    watchers: "45",
    updatedAt: "1 week ago",
    status: "Paused",
    private: false,
    pendingMurders: 8
  }
]
