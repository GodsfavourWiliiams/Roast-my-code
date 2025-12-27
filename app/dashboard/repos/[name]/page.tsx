import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GitPullRequest, Skull, Warning, CheckCircle } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

export default async function RepoDetailsPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/repos">
            <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
            </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{decodedName}</h1>
            <p className="text-muted-foreground">Detailed autopsy of this codebase.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-destructive flex items-center gap-2">
                    <Skull size={24} weight="fill" /> 1,240
                </div>
                <p className="text-xs text-muted-foreground mt-1">Code crimes detected</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-orange-500 flex items-center gap-2">
                    <Warning size={24} weight="fill" /> 42
                </div>
                <p className="text-xs text-muted-foreground mt-1">Immediate refactor needed</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Survival Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
                    <CheckCircle size={24} weight="fill" /> 12%
                </div>
                <p className="text-xs text-muted-foreground mt-1">PRs passed without roast</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Recent Roast History</CardTitle>
            <CardDescription>A timeline of failure.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div className="mt-1 bg-muted p-2 rounded-full">
                            <GitPullRequest size={16} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">fix: navigation bug</span>
                                <Badge variant="destructive">Roast Score: 9/10</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                &quot;This isn&apos;t a navigation fix, it&apos;s a labyrinth. Why are you using `window.location` in a React app? Do you enjoy suffering?&quot;
                            </p>
                            <span className="text-xs text-muted-foreground">2 hours ago by @senior-dev</span>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
