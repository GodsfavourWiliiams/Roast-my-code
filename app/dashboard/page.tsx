import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  PlusIcon, 
  GithubLogo, 
  TrendUp, 
  Warning 
} from "@phosphor-icons/react/dist/ssr"
import { Flame } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Toxic Command Center
          </h1>
          <p className="text-muted-foreground">
            Welcome back, code-monkey. Ready to have your feelings hurt today?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="h-10 font-semibold">
            <PlusIcon strokeWidth={4} /> Link More Trash
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egos Bruised</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              +20.1% higher than last week (yikes)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tears (Litres)
            </CardTitle>
            <TrendUp size={16} weight="bold" className="text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2L</div>
            <p className="text-xs text-muted-foreground">
              Volume increasing exponentially
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Objective Garbage
            </CardTitle>
            <Warning size={16} weight="bold" className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Lines that make me want to retire
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hostages (Repos)
            </CardTitle>
            <GithubLogo
              size={16}
              weight="bold"
              className="text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              3 updated (poorly) recently
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area: Recent Activity & Repo List */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Roasts Table */}
        <Card className="col-span-4 lg:col-span-5 border-border">
          <CardHeader>
            <CardTitle>Recent Slaughter</CardTitle>
            <CardDescription>
              A list of pull requests that didn&apos;t stand a chance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] px-5">Project</TableHead>
                    <TableHead className="px-5">PR Attempt</TableHead>
                    <TableHead className="px-5">Outcome</TableHead>
                    <TableHead className="px-5">Cruelty</TableHead>
                    <TableHead className="text-right px-5">
                      Moment of Failure
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRoasts.map((roast) => (
                    <TableRow key={roast.id}>
                      <TableCell className="font-medium whitespace-nowrap p-5">
                        {roast.repo}
                      </TableCell>
                      <TableCell className="whitespace-nowrap p-5">
                        {roast.prTitle}
                      </TableCell>
                      <TableCell className="p-5">
                        <Badge
                          variant={
                            roast.status === 'Roasted'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={
                            roast.status === 'Approved'
                              ? 'bg-green-500 hover:bg-green-600 border-transparent text-white'
                              : ''
                          }
                        >
                          {roast.status === 'Roasted'
                            ? 'DESTROYED'
                            : roast.status === 'Approved'
                            ? 'SURE, WHATEVER'
                            : 'JUDGING...'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{roast.score}/10</span>
                          {roast.score > 8 && (
                            <Flame className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-5 text-muted-foreground whitespace-nowrap">
                        {roast.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Repos / Quick Stats */}
        <Card className="col-span-3 lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle>Victim List</CardTitle>
            <CardDescription>
              Codebases I currently have to look at.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {linkedRepos.map((repo) => (
                <div key={repo.name} className="flex items-center">
                  <Avatar className="h-9 w-9 rounded-none border border-border">
                    <AvatarImage src={repo.icon} alt="Avatar" />
                    <AvatarFallback>GH</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {repo.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{repo.desc}</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-muted-foreground">
                    {repo.lastActive}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full">
                View All Shame
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Mock Data
const recentRoasts = [
    {
        id: "1",
        repo: "frontend-v2",
        prTitle: "fix: button alignment",
        status: "Roasted",
        score: 9.5,
        date: "2 mins ago"
    },
    {
        id: "2",
        repo: "backend-api",
        prTitle: "feat: user auth flow",
        status: "Approved",
        score: 2.1,
        date: "1 hour ago"
    },
    {
        id: "3",
        repo: "legacy-code",
        prTitle: "refactor: god class",
        status: "Roasted",
        score: 10,
        date: "4 hours ago"
    },
    {
        id: "4",
        repo: "mobile-app",
        prTitle: "chore: update deps",
        status: "Pending",
        score: 0,
        date: "Yesterday"
    },
    {
        id: "5",
        repo: "frontend-v2",
        prTitle: "style: dark mode",
        status: "Roasted",
        score: 8.8,
        date: "Yesterday"
    },
]

const linkedRepos = [
    {
        name: "frontend-v2",
        desc: "React, Next.js",
        initials: "FV",
        icon: "/github-icon.png", // placeholder
        lastActive: "2m"
    },
    {
        name: "backend-api",
        desc: "Node.js, Express",
        initials: "BA",
        icon: "/github-icon.png",
        lastActive: "1h"
    },
    {
        name: "legacy-code",
        desc: "Java 8, Spagetti",
        initials: "LC",
        icon: "/github-icon.png",
        lastActive: "4h"
    },
    {
        name: "infra-k8s",
        desc: "Terraform",
        initials: "IK",
        icon: "/github-icon.png",
        lastActive: "2d"
    },
]
