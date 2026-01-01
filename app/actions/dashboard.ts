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
  timestamp: string;
}

export interface RepoCrime {
  name: string;
  violations: number;
  critical: number;
}

interface RoastData {
  violations_count: number | null;
  critical_issues_count: number | null;
  roast_score: number | null;
  created_at: string;
  repositories: {
    name: string;
  } | null;
}

interface RecentRoastRaw {
  id: number;
  pr_title: string | null;
  pr_number: number | null;
  roast_content: string;
  roast_score: number | null;
  created_at: string;
  repositories: {
    name: string;
  } | null;
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

  const emptyStats: DashboardStats = {
    egos_bruised: 0,
    total_violations: 0,
    critical_issues: 0,
    avg_score: "0.0",
    active_repos: 0,
    hostages: 0
  };

  if (!user) return { stats: emptyStats, recent_roasts: [], score_trend: [], repo_crimes: [], error: 'Not authenticated' };

  try {
    // 1. Fetch Overview Stats & Analytics in one unified query
    const { count: egos_bruised } = await supabase.from('roasts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: hostages } = await supabase.from('repositories').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: active_repos } = await supabase.from('repositories').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'Running');
    
    const { data: roast_data_unified } = await supabase
        .from('roasts')
        .select('violations_count, critical_issues_count, roast_score, created_at, repositories ( name )')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .returns<RoastData[]>();

    let total_violations = 0;
    let critical_issues = 0;
    let avg_score = "0.0";
    const repo_map: Record<string, RepoCrime> = {};

    if (roast_data_unified?.length) {
        const totals = roast_data_unified.reduce((acc, curr) => ({
            violations: acc.violations + (curr.violations_count || 0),
            critical: acc.critical + (curr.critical_issues_count || 0),
            score_sum: acc.score_sum + (curr.roast_score || 0),
        }), { violations: 0, critical: 0, score_sum: 0 });

        total_violations = totals.violations;
        critical_issues = totals.critical;
        avg_score = (totals.score_sum / roast_data_unified.length).toFixed(1);

        // Calculate Crimes per Repo using the same data
        roast_data_unified.forEach((item) => {
            const repo_name = item.repositories?.name || 'Unknown';
            if (!repo_map[repo_name]) {
                repo_map[repo_name] = { name: repo_name, violations: 0, critical: 0 };
            }
            repo_map[repo_name].violations += (item.violations_count || 0);
            repo_map[repo_name].critical += (item.critical_issues_count || 0);
        });
    }

    // 2. Fetch Recent Roasts
    const { data: recent_data } = await supabase
      .from('roasts')
      .select(`id, pr_title, pr_number, roast_content, roast_score, created_at, repositories ( name )`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<RecentRoastRaw[]>();

    const recent_roasts: RecentRoast[] = (recent_data || []).map((item) => ({
      id: item.id,
      title: item.pr_title || (item.pr_number ? `PR #${item.pr_number}` : 'Manual Roast'),
      repo_name: item.repositories?.name || 'Unknown Repo',
      roast_score: item.roast_score || 0,
      description: item.roast_content,
      date: item.created_at,
    }));

    const score_trend: ScoreTrend[] = (roast_data_unified || []).map(r => ({
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: r.roast_score || 0,
      timestamp: new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }));

    return {
      stats: { egos_bruised: egos_bruised || 0, total_violations, critical_issues, avg_score, active_repos: active_repos || 0, hostages: hostages || 0 },
      recent_roasts,
      score_trend,
      repo_crimes: Object.values(repo_map),
      error: null
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { stats: emptyStats, recent_roasts: [], score_trend: [], repo_crimes: [], error: message };
  }
}