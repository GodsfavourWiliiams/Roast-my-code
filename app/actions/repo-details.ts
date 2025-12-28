'use server';

import { createClient } from '@/lib/supabase/server';

export interface Roast {
  id: number;
  pr_number: number | null;
  pr_title: string | null;
  roast_content: string;
  roast_score: number | null;
  created_at: string;
}

export interface RepoDetails {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  url: string;
  private: boolean;
  status: 'Running' | 'Paused';
  updated_at: string;
  roasts: Roast[];
  stats: {
    totalViolations: number;
    criticalIssues: number;
    survivalRate: number;
  }
}

export async function getRepoDetails(repoName: string): Promise<{ data: RepoDetails | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // 1. Fetch Repository
  const { data: repo, error: repoError } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .eq('name', repoName)
    .single();

  if (repoError) {
    console.error('Error fetching repo:', repoError);
    return { data: null, error: 'Repository not found' };
  }

  // 2. Fetch Roasts
  const { data: roasts, error: roastsError } = await supabase
    .from('roasts')
    .select('*')
    .eq('repo_id', repo.id)
    .order('created_at', { ascending: false });

  if (roastsError) {
    console.error('Error fetching roasts:', roastsError);
    return { data: null, error: 'Failed to load roast history' };
  }

  // 3. Logic-Driven Statistics
  
  // Total Violations = Sum of explicit violations detected by AI
  const totalViolations = roasts.reduce((acc, r) => acc + (r.violations_count || 0), 0);
  
  // Critical Issues = Sum of explicit critical issues detected by AI
  const criticalIssues = roasts.reduce((acc, r) => acc + (r.critical_issues_count || 0), 0);

  // Survival Rate = Strictly based on Pull Requests (PRs)
  // Survival = PR score >= 7
  const prRoasts = roasts.filter(r => r.pr_number !== null);
  const totalPrs = prRoasts.length;
  const prSurvivors = prRoasts.filter(r => r.roast_score !== null && r.roast_score >= 7).length;

  // If no PRs have been roasted yet, we return -1 to signal "N/A" in the UI
  const survivalRate = totalPrs === 0 
    ? -1 
    : Math.round((prSurvivors / totalPrs) * 100);

  console.log(`[Stats/${repoName}] Violations:${totalViolations} | Critical:${criticalIssues} | PRs:${totalPrs} | Survival:${survivalRate}%`);

  return {
    data: {
      ...repo,
      roasts: roasts as Roast[],
      stats: {
        totalViolations,
        criticalIssues,
        survivalRate
      }
    },
    error: null
  };
}