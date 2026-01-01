'use server';

import { createClient } from '@/lib/supabase/server';

export interface ScoreTrend {
  date: string;
  score: number;
}

export interface RepoCrime {
  name: string;
  violations: number;
  critical: number;
}

export async function getAnalyticsData(): Promise<{
  scoreTrend: ScoreTrend[];
  repoCrimes: RepoCrime[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { scoreTrend: [], repoCrimes: [], error: 'Not authenticated' };

  // 1. Fetch Score Trend (Scores over time)
  const { data: trendData, error: trendError } = await supabase
    .from('roasts')
    .select('created_at, roast_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (trendError) return { scoreTrend: [], repoCrimes: [], error: trendError.message };

  const scoreTrend: ScoreTrend[] = (trendData || []).map(r => ({
    date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: r.roast_score || 0
  }));

  // 2. Fetch Repo Crimes (Violations grouped by repo)
  const { data: crimesData, error: crimesError } = await supabase
    .from('roasts')
    .select(`
      violations_count,
      critical_issues_count,
      repositories (
        name
      )
    `)
    .eq('user_id', user.id);

  if (crimesError) return { scoreTrend: [], repoCrimes: [], error: crimesError.message };

  // Group by repo name
  const repoMap: Record<string, RepoCrime> = {};
  (crimesData || []).forEach((item: any) => {
    const repoName = item.repositories?.name || 'Unknown';
    if (!repoMap[repoName]) {
      repoMap[repoName] = { name: repoName, violations: 0, critical: 0 };
    }
    repoMap[repoName].violations += (item.violations_count || 0);
    repoMap[repoName].critical += (item.critical_issues_count || 0);
  });

  const repoCrimes = Object.values(repoMap);

  return { scoreTrend, repoCrimes, error: null };
}
