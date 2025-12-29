'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  egos_bruised: number;
  total_violations: number;
  active_repos: number;
}

export interface RecentRoast {
  id: number;
  title: string;
  repo_name: string;
  roast_score: number;
  description: string;
  date: string;
}

export async function fetchDashboardStats(): Promise<{
  stats: DashboardStats;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      stats: { egos_bruised: 0, total_violations: 0, active_repos: 0 },
      error: 'Not authenticated',
    };
  }

  // 1. egos_bruised = Total Roasts Count
  const { count: egos_bruised, error: countError } = await supabase
    .from('roasts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    return {
      stats: { egos_bruised: 0, total_violations: 0, active_repos: 0 },
      error: countError.message,
    };
  }

  // 2. total_violations (Sum of violations_count)
  const { data: roasts } = await supabase
    .from('roasts')
    .select('violations_count')
    .eq('user_id', user.id);

  const total_violations =
    roasts?.reduce((acc, curr) => acc + (curr.violations_count || 0), 0) || 0;

  // 3. active_repos = Number of Active Repos
  const { count: active_repos } = await supabase
    .from('repositories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Running');

  return {
    stats: {
      egos_bruised: egos_bruised || 0,
      total_violations: total_violations,
      active_repos: active_repos || 0,
    },
    error: null,
  };
}

export async function fetchRecentRoasts(): Promise<{
  roasts: RecentRoast[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { roasts: [], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('roasts')
    .select(
      `
      id,
      pr_title,
      pr_number,
      roast_content,
      roast_score,
      created_at,
      repositories (
        name
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    return { roasts: [], error: error.message };
  }

  type RoastQueryResult = {
    id: number;
    pr_title: string | null;
    pr_number: number | null;
    roast_content: string | null;
    roast_score: number | null;
    created_at: string;
    repositories: { name: string } | { name: string }[] | null;
  };

  const roasts: RecentRoast[] = (data as unknown as RoastQueryResult[]).map((item) => {
    const repo = Array.isArray(item.repositories)
      ? item.repositories[0]
      : item.repositories;

    return {
      id: item.id,
      title:
        item.pr_title ||
        (item.pr_number ? `PR #${item.pr_number}` : 'Manual Roast'),
      repo_name: repo?.name || 'Unknown Repo',
      roast_score: item.roast_score || 0,
      description: item.roast_content || '',
      date: item.created_at,
    };
  });

  return {
    roasts,
    error: null,
  };
}