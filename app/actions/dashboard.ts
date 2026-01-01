'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  egos_bruised: number;
  total_violations: number;
  critical_issues: number;
  avg_score: string;
  active_repos: number;
  hostages: number;
}

export interface RecentRoast {
  id: number;
  title: string;
  repo_name: string;
  roast_score: number;
  description: string;
  date: string;
}

export interface ScoreTrend {
  date: string;
  score: number;
}

export interface RepoCrime {
  name: string;
  violations: number;
  critical: number;
}

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recent_roasts: RecentRoast[];
  score_trend: ScoreTrend[];
  repo_crimes: RepoCrime[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { stats: {} as any, recent_roasts: [], score_trend: [], repo_crimes: [], error: 'Not authenticated' };

  try {
    // 1. Fetch Overview Stats
    const { count: egos_bruised } = await supabase.from('roasts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: hostages } = await supabase.from('repositories').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: active_repos } = await supabase.from('repositories').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'Running');
    
    const { data: roast_metrics } = await supabase
        .from('roasts')
        .select('violations_count, critical_issues_count, roast_score')
        .eq('user_id', user.id);

    const total_violations = roast_metrics?.reduce((acc, curr) => acc + (curr.violations_count || 0), 0) || 0;
    const critical_issues = roast_metrics?.reduce((acc, curr) => acc + (curr.critical_issues_count || 0), 0) || 0;
    
    const avg_score = roast_metrics?.length 
        ? (roast_metrics.reduce((acc, curr) => acc + (curr.roast_score || 0), 0) / roast_metrics.length).toFixed(1)
        : "0.0";

    // 2. Fetch Recent Roasts
    const { data: recent_data } = await supabase
      .from('roasts')
      .select(`id, pr_title, pr_number, roast_content, roast_score, created_at, repositories ( name )`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recent_roasts: RecentRoast[] = (recent_data || []).map((item: any) => ({
      id: item.id,
      title: item.pr_title || (item.pr_number ? `PR #${item.pr_number}` : 'Manual Roast'),
      repo_name: item.repositories?.name || 'Unknown Repo',
      roast_score: item.roast_score || 0,
      description: item.roast_content,
      date: item.created_at,
    }));

    // 3. Fetch Analytics Data
    const { data: trend_data } = await supabase.from('roasts').select('created_at, roast_score').eq('user_id', user.id).order('created_at', { ascending: true });
    const score_trend: ScoreTrend[] = (trend_data || []).map(r => ({
      date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.roast_score || 0
    }));

    const repo_map: Record<string, RepoCrime> = {};
    roast_metrics?.forEach((item: any) => {
      // Note: we need repo name here too, but roast_metrics above didn't include it. 
      // Re-fetching or joining above is better. I'll stick to basic grouping logic.
    });
    // Let's refine the Crimes per Repo fetch
    const { data: crimes_data } = await supabase.from('roasts').select(`violations_count, critical_issues_count, repositories ( name )`).eq('user_id', user.id);
    (crimes_data || []).forEach((item: any) => {
      const repoName = item.repositories?.name || 'Unknown';
      if (!repo_map[repoName]) repo_map[repoName] = { name: repoName, violations: 0, critical: 0 };
      repo_map[repoName].violations += (item.violations_count || 0);
      repo_map[repoName].critical += (item.critical_issues_count || 0);
    });

    return {
      stats: { egos_bruised: egos_bruised || 0, total_violations, critical_issues, avg_score, active_repos: active_repos || 0, hostages: hostages || 0 },
      recent_roasts,
      score_trend,
      repo_crimes: Object.values(repo_map),
      error: null
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { stats: {} as any, recent_roasts: [], score_trend: [], repo_crimes: [], error: message };
  }
}