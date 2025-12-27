"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Warning
} from "@phosphor-icons/react/dist/ssr"

export default function AnalyticsPage() {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pain Analytics</h1>
        <p className="text-muted-foreground">
          Quantified proof of your declining engineering standards.
        </p>
      </div>

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
                        <LineChart data={trendData}>
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
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
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
                        <BarChart data={trendData}>
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
