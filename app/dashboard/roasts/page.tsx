"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MagnifyingGlass, 
  Funnel, 
  GitCommit, 
  Flame, 
  ArrowRight,
  CalendarBlank,
  Tag,
  Ghost,
  WarningOctagon
} from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function RoastsPage() {
  const [filter, setFilter] = useState("all")
  const [selectedRoast, setSelectedRoast] = useState<any>(null)
  
  // Simulated States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [roasts, setRoasts] = useState<any[]>([])

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      // Toggle these comments to test different states
      setRoasts([]) 
      // setRoasts(dummyRoastHistory) 
      // setError(true)
      
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])


  const handleFilterChange = (val: string) => {
    setFilter(val)
    toast.info(`Filtering by: ${val}`)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 }
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
            <WarningOctagon size={64} className="text-destructive animate-pulse" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-destructive mb-2">
            System Failure
        </h2>
        <p className="max-w-md text-muted-foreground mb-6">
            &gt; Error: Memory corruption detected. <br/>
            &gt; Cause: Your past code was so bad it broke the database. <br/>
            &gt; Status: Your history is safe... for now.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="font-mono">
            Retry Connection
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">The Wall of Shame</h1>
        <p className="text-muted-foreground">
          Permanent receipts of every time you thought &quot;it works on my machine&quot;.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
            <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search for regrets (e.g. 'memory leak', 'useEffect')..."
              className="pl-9"
              disabled={isLoading || roasts.length === 0}
            />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={isLoading || roasts.length === 0}>
              <Funnel size={16} weight="bold" />
              Filter Severity
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Roast Intensity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={filter === "all"} onCheckedChange={() => handleFilterChange("all")}>
              All Disasters
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filter === "nuclear"} onCheckedChange={() => handleFilterChange("nuclear")}>
              Nuclear (Score 0-3)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filter === "painful"} onCheckedChange={() => handleFilterChange("painful")}>
              Painful (Score 4-7)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filter === "nitpick"} onCheckedChange={() => handleFilterChange("nitpick")}>
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
                    <div className="hidden md:block absolute left-[-2rem] top-0 bottom-[-1rem] w-px bg-border/50 ml-[2.25rem]"></div>
                    <Card className="border-2 border-muted">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-48 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-5 w-16 mt-2" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-4 w-64" />
                                        </div>
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                    </div>
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
             ))}
        </div>
      ) : roasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5">
            <div className="rounded-full bg-muted p-6 mb-6">
                <Ghost size={48} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">No History of Violence... Yet</h2>
            <p className="text-muted-foreground max-w-md text-center mb-8">
                Your record is clean. Suspiciously clean. Submit a PR to start filling this graveyard.
            </p>
            <Button className="uppercase font-bold tracking-wide">
                Submit Code
            </Button>
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
            <motion.div key={roast.id} variants={item} className="relative pl-8 md:pl-0">
                {/* Timeline Line (Desktop) */}
                <div className="hidden md:block absolute left-[-2rem] top-0 bottom-[-1rem] w-px bg-border/50 ml-[2.25rem]"></div>
                <div className="hidden md:flex absolute left-[-2rem] top-6 h-4 w-4 rounded-full bg-background border-2 border-primary items-center justify-center z-10 ml-[1.8rem]">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>

                <Card className="hover:border-primary/50 transition-colors border-2">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Left: Meta */}
                            <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                    <GitCommit size={16} weight="bold" />
                                    <span className="font-mono">{roast.commitHash}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarBlank size={14} /> {roast.date}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Tag size={14} /> {roast.repo}
                                </div>
                                <Badge 
                                    variant="outline" 
                                    className={`w-fit mt-1 ${
                                        roast.status === "Rejected" ? "text-destructive border-destructive/50" : 
                                        roast.status === "Merged" ? "text-green-500 border-green-500/50" : 
                                        "text-muted-foreground"
                                    }`}
                                >
                                    {roast.status === "Rejected" ? "Rejected (Rightfully)" : 
                                    roast.status === "Merged" ? "Merged (Miraculously)" : 
                                    "Closed (In Shame)"}
                                </Badge>
                            </div>

                            {/* Right: Content */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{roast.prTitle}</h3>
                                        <p className="text-sm text-muted-foreground italic">&quot;{roast.highlight}&quot;</p>
                                    </div>
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <span className="text-2xl font-black text-destructive">{roast.score}</span>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Score</span>
                                    </div>
                                </div>
                                
                                <div className="bg-muted/30 p-3 rounded-md text-sm font-mono border border-border/50">
                                    <span className="text-destructive font-bold">{">"}</span> {roast.insult}
                                </div>

                                <div className="flex justify-end">
                                    <SheetTrigger asChild onClick={() => setSelectedRoast(roast)}>
                                        <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold hover:bg-primary/10">
                                            Read Full Autopsy <ArrowRight size={16} weight="bold" />
                                        </Button>
                                    </SheetTrigger>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            ))}

            <SheetContent className="sm:max-w-xl overflow-y-auto">
                {selectedRoast && (
                    <div className="space-y-8 py-6">
                        <SheetHeader className="space-y-4 border-b pb-6">
                            <div className="flex items-center gap-2 text-primary font-mono text-sm font-bold uppercase tracking-widest">
                                <GitCommit size={18} weight="bold" />
                                Report #{selectedRoast.commitHash}
                            </div>
                            <SheetTitle className="text-3xl font-black uppercase tracking-tighter leading-none">
                                {selectedRoast.prTitle}
                            </SheetTitle>
                            <SheetDescription className="text-base font-medium">
                                Conducted on {selectedRoast.date} for <span className="text-foreground font-bold">{selectedRoast.repo}</span>
                            </SheetDescription>
                            <div className="flex items-center gap-4">
                                <div className="bg-destructive/10 border-2 border-destructive p-4 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-destructive">{selectedRoast.score}</span>
                                    <span className="text-[10px] font-bold uppercase text-destructive tracking-widest">Incompetence Score</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Bot Verdict</p>
                                    <p className="text-sm font-bold leading-tight italic">&quot;{selectedRoast.highlight}&quot;</p>
                                </div>
                            </div>
                        </SheetHeader>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Flame size={18} weight="fill" className="text-primary" /> Senior Dev&apos;s Review
                                </h4>
                                <div className="bg-muted p-4 border-l-4 border-primary font-mono text-sm leading-relaxed">
                                    {selectedRoast.fullReview}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-black uppercase tracking-widest">Criminal Violations</h4>
                                <ul className="space-y-2">
                                    {selectedRoast.violations.map((violation: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                                            <span>{violation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-foreground text-background p-6 rounded-none space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest opacity-70">Suggested Action</p>
                                <p className="text-lg font-bold italic underline decoration-destructive decoration-4 underline-offset-4">
                                    {selectedRoast.action}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
            </Sheet>
        </motion.div>
      )}
    </div>
  )
}

const dummyRoastHistory = [
    {
        id: "1",
        repo: "frontend-v2",
        commitHash: "8f3a12",
        date: "Today, 10:42 AM",
        prTitle: "fix: center div attempt #4",
        status: "Rejected",
        score: "1.2",
        highlight: "CSS Crimes",
        insult: "You used absolute positioning to center a text element. I hope you're proud. Flexbox has existed for a decade.",
        fullReview: "I had to close my laptop and take a walk after seeing this. You've somehow managed to ignore 10 years of CSS evolution in a single commit. The use of z-index: 999999 is the cherry on top of this architectural landfill.",
        violations: [
            "Use of magic numbers for positioning",
            "Extremely excessive z-index (999999)",
            "Violation of project styling guidelines",
            "Lack of responsive considerations"
        ],
        action: "Delete the CSS file and start over with Tailwind."
    },
    {
        id: "2",
        repo: "backend-api",
        commitHash: "c41d99",
        date: "Yesterday, 4:20 PM",
        prTitle: "feat: add user auth",
        status: "Merged",
        score: "3.5",
        highlight: "Security Risk",
        insult: "Hardcoding secrets in a commit named 'wip' is basically inviting hackers to dinner.",
        fullReview: "Merging this was a mistake, but we needed the feature. Every time I look at lines 45-52, I feel a piece of my soul die. You're treating production credentials like a grocery list.",
        violations: [
            "Secrets exposed in git history",
            "Insecure cookie configuration",
            "Missing input validation on /login",
            "Inconsistent naming conventions"
        ],
        action: "Rotate all production keys and apologize to the DevOps team."
    },
    {
        id: "3",
        repo: "mobile-ios",
        commitHash: "7b2x11",
        date: "Oct 24, 2024",
        prTitle: "refactor: cleanup utils",
        status: "Closed",
        score: "0.0",
        highlight: "Total Destruction",
        insult: "This isn't a refactor, it's a massacre. You broke 142 tests and the build won't even start.",
        fullReview: "I'm genuinely impressed by the scope of the damage. You've managed to break utilities that weren't even related to your changes. This is less 'refactoring' and more 'digital arson'.",
        violations: [
            "Breaking change without migration path",
            "Deleted shared constants used by 12 modules",
            "No tests updated to reflect changes",
            "Build script failure"
        ],
        action: "Revert the entire branch and take a week of PTO."
    }
]