"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar
} from "recharts"
import { 
  TrendDown, 
  Drop, 
  Trash, 
  ArrowsClockwise, 
  Warning,
  Ghost,
  WarningOctagon
} from "@phosphor-icons/react/dist/ssr"
import { useState, useEffect } from "react"

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
        // Toggle these for testing:
        setData(null) 
        // setData({ trend: trendData, radar: radarData })
        // setError(true)

        setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

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
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
            <WarningOctagon size={64} className="text-destructive animate-pulse" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-destructive mb-2">
            Calculation Error
        </h2>
        <p className="max-w-md text-muted-foreground mb-6">
            &gt; Error: Integer overflow. <br/>
            &gt; Cause: The number of bugs in your code exceeded 64-bit limits. <br/>
            &gt; Solution: Stop writing code.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="font-mono">
            Reboot System
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pain Analytics</h1>
        <p className="text-muted-foreground">
          Quantified proof of your declining engineering standards.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
             ))}
             <Card className="col-span-2 lg:col-span-3 h-[400px]">
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-full w-full" />
                </CardContent>
             </Card>
             <Card className="col-span-2 lg:col-span-1 h-[400px]">
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-48 w-48 rounded-full" />
                </CardContent>
             </Card>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5">
            <div className="rounded-full bg-muted p-6 mb-6">
                <Ghost size={48} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">Insufficient Failure Data</h2>
            <p className="text-muted-foreground max-w-md text-center mb-8">
                I can&apos;t generate a trend line with zero data points. Go break something so I can graph it.
            </p>
            <Button className="uppercase font-bold tracking-wide">
                Generate Errors
            </Button>
        </div>
      ) : (
        <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* KPI Cards */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendDown size={16} weight="bold" className="text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4 / 10</div>
                        <p className="text-xs text-muted-foreground">-12% from last month</p>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tears (L)</CardTitle>
                        <Drop size={16} weight="bold" className="text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.8 L</div>
                        <p className="text-xs text-muted-foreground">Hydration recommended</p>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lines Deleted</CardTitle>
                        <Trash size={16} weight="bold" className="text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14,203</div>
                        <p className="text-xs text-muted-foreground">By force, mostly</p>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Refactors</CardTitle>
                        <ArrowsClockwise size={16} weight="bold" className="text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">89</div>
                        <p className="text-xs text-muted-foreground">Demanded immediately</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Charts */}
            
            {/* Line Chart: The Decline */}
            <motion.div variants={item} className="col-span-2 lg:col-span-3">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>The Trend of Despair</CardTitle>
                        <CardDescription>Your code quality score over the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis 
                                    dataKey="day" 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    domain={[0, 10]}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="var(--primary)" 
                                    strokeWidth={3} 
                                    dot={{ fill: 'var(--primary)', r: 4 }} 
                                    activeDot={{ r: 6 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Radar Chart: Violation Distribution */}
            <motion.div variants={item} className="col-span-2 lg:col-span-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Bad Habits</CardTitle>
                        <CardDescription>Distribution of your incompetence.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar
                                    name="Violations"
                                    dataKey="A"
                                    stroke="var(--destructive)"
                                    fill="var(--destructive)"
                                    fillOpacity={0.3}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bar Chart: Daily Roast Intensity */}
            <motion.div variants={item} className="col-span-2 lg:col-span-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Roast Intensity Heatmap</CardTitle>
                        <CardDescription>Volume of insults received per day.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis 
                                    dataKey="day" 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <RechartsTooltip
                                    cursor={{fill: 'var(--muted)'}}
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="insults" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>

        </motion.div>
      )}
    </div>
  )
}

const trendData = [
  { day: 'Mon', score: 8.5, insults: 2 },
  { day: 'Tue', score: 7.2, insults: 5 },
  { day: 'Wed', score: 6.0, insults: 12 },
  { day: 'Thu', score: 4.5, insults: 20 },
  { day: 'Fri', score: 2.1, insults: 45 },
  { day: 'Sat', score: 3.5, insults: 15 },
  { day: 'Sun', score: 1.0, insults: 60 },
]

const radarData = [
  { subject: 'Spaghetti', A: 120, fullMark: 150 },
  { subject: 'No Tests', A: 98, fullMark: 150 },
  { subject: 'Any Type', A: 86, fullMark: 150 },
  { subject: 'Hardcoded', A: 99, fullMark: 150 },
  { subject: 'Console.log', A: 85, fullMark: 150 },
  { subject: 'Copy Paste', A: 65, fullMark: 150 },
]