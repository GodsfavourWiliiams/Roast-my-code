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
  BarChart,
  Bar,
} from 'recharts';
import {
  DropIcon,
  GhostIcon,
  WarningOctagonIcon,
  SkullIcon,
  WarningIcon,
} from '@phosphor-icons/react/dist/ssr';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsData } from '@/app/actions/analytics';
import { ShieldAlertIcon } from 'lucide-react';

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: async () => {
      const result = await getAnalyticsData();
      if (result.error) throw new Error(result.error);
      return result;
    },
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  if (isError) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="mb-6 rounded-full bg-destructive/10 p-6">
          <WarningOctagonIcon
            size={64}
            className="text-destructive animate-pulse"
          />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-destructive mb-2">
          Calculation Error
        </h2>
        <p className="max-w-md text-muted-foreground mb-6">
          &gt; Error: Integer overflow. <br />
          &gt; Cause: The number of bugs in your code exceeded 64-bit limits.{' '}
          <br />
          &gt; Solution: Stop writing code.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="font-mono"
        >
          Reboot System
        </Button>
      </div>
    );
  }

  const hasData =
    data && (data.scoreTrend.length > 0 || data.repoCrimes.length > 0);

  // Calculate high-level stats
  const avgScore = data?.scoreTrend.length
    ? (
        data.scoreTrend.reduce((acc, curr) => acc + curr.score, 0) /
        data.scoreTrend.length
      ).toFixed(1)
    : '0.0';

  const totalViolations =
    data?.repoCrimes.reduce((acc, curr) => acc + curr.violations, 0) || 0;
  const totalCritical =
    data?.repoCrimes.reduce((acc, curr) => acc + curr.critical, 0) || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Pain Analytics
        </h1>
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
            <CardContent className="flex items-center justify-center h-full">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/5">
          <div className="rounded-full bg-muted p-6 mb-6">
            <GhostIcon size={48} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-xl font-bold mb-2">Insufficient Failure Data</h2>
          <p className="text-muted-foreground max-w-md text-center mb-8">
            I can&apos;t generate a trend line with zero data points. Go break
            something so I can graph it.
          </p>
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
                <CardTitle className="text-sm font-medium">
                  Avg Roast Score
                </CardTitle>
                <SkullIcon size={16} weight="bold" className="text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgScore} / 10</div>
                <p className="text-xs text-muted-foreground">
                  Overall competence rating
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Violations
                </CardTitle>
                <WarningIcon
                  size={16}
                  weight="bold"
                  className="text-yellow-500"
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViolations}</div>
                <p className="text-xs text-muted-foreground">
                  Rules blatantly ignored
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Critical Issues
                </CardTitle>
                <ShieldAlertIcon size={16} className="text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCritical}</div>
                <p className="text-xs text-muted-foreground">
                  Emergency refactors needed
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tears (L)
                </CardTitle>
                <DropIcon size={16} weight="bold" className="text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(totalViolations * 0.1).toFixed(1)} L
                </div>
                <p className="text-xs text-muted-foreground">
                  Estimated hydration loss
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts */}

          {/* Line Chart: The Trend of Despair */}
          <motion.div variants={item} className="col-span-2 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>The Trend of Despair</CardTitle>
                <CardDescription>
                  Your code quality score over every roast performed.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.scoreTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 10]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }}
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

          {/* Bar Chart: Repo Crimes */}
          <motion.div variants={item} className="col-span-2 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Crimes by Repository</CardTitle>
                <CardDescription>
                  Total violations and critical issues per codebase.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.repoCrimes}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'var(--muted)' }}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="violations"
                      fill="var(--yellow-500)"
                      radius={[4, 4, 0, 0]}
                      name="Violations"
                    />
                    <Bar
                      dataKey="critical"
                      fill="var(--destructive)"
                      radius={[4, 4, 0, 0]}
                      name="Critical Issues"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
