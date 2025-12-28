'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  egosBruised: number;
  tearsLitres: number;
  objectiveGarbage: number;
}

export interface RecentRoast {
  id: number;
  title: string;
  repoName: string;
  roastScore: number;
  description: string;
  date: string;
}

export async function fetchDashboardStats(): Promise<{ stats: DashboardStats; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { stats: { egosBruised: 0, tearsLitres: 0, objectiveGarbage: 0 }, error: 'Not authenticated' };
  }

  // 1. Egos Bruised = Total Roasts Count
  const { count: egosBruised, error: countError } = await supabase
    .from('roasts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
     console.error("Error fetching stats:", countError);
     return { stats: { egosBruised: 0, tearsLitres: 0, objectiveGarbage: 0 }, error: countError.message };
  }

  // 2. Tears Litres = Sum of roast scores (just a fun metric derivation)
  // We need to fetch scores to sum them
  const { data: roasts } = await supabase
    .from('roasts')
    .select('roast_score')
    .eq('user_id', user.id);

  let totalScore = 0;
  if (roasts) {
    totalScore = roasts.reduce((acc, curr) => acc + (curr.roast_score || 0), 0);
  }

  // Calculate tears based on score (e.g. 0.5L per point)
  const tearsLitres = parseFloat((totalScore * 0.5).toFixed(1));

  // 3. Objective Garbage = Number of Repos with status 'Running'
  const { count: objectiveGarbage } = await supabase
    .from('repositories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'Running');

  return {
    stats: {
      egosBruised: egosBruised || 0,
      tearsLitres: tearsLitres,
      objectiveGarbage: objectiveGarbage || 0,
    },
    error: null,
  };
}

export async function fetchRecentRoasts(): Promise<{ roasts: RecentRoast[]; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { roasts: [], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('roasts')
    .select(`
      id,
      pr_title,
      roast_content,
      roast_score,
      created_at,
      repositories (
        name
      )
    `)
    .eq('user_id', user.id)
    .not('pr_number', 'is', null) // Only include actual PRs
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent roasts:", error);
    return { roasts: [], error: error.message };
  }

  type RoastQueryResult = {
    id: number;
    pr_title: string | null;
    roast_content: string | null;
    roast_score: number | null;
    created_at: string;
    repositories: { name: string } | { name: string }[] | null;
  };

  const roasts: RecentRoast[] = (data || []).map((item: RoastQueryResult) => {
    const repo = Array.isArray(item.repositories)
      ? item.repositories[0]
      : item.repositories;

    return {
      id: item.id,
      title: item.pr_title || 'Unknown PR',
      repoName: repo?.name || 'Unknown Repo',
      roastScore: item.roast_score || 0,
      description: item.roast_content || '',
      date: item.created_at,
    };
  });

  return {
    roasts,
    error: null,
  };
}