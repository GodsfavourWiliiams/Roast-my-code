'use server';

import { createClient } from '@/lib/supabase/server';

export interface Roast {
  id: number;
  pr_number: number | null;
  pr_title: string | null;
  roast_content: string;
  roast_score: number | null;
  violations_count: number;
  critical_issues_count: number;
  created_at: string;
}

export interface RepoDetails {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  framework: string | null;
  url: string;
  private: boolean;
  status: 'Running' | 'Paused' | 'Idle';
  updated_at: string;
  roasts: Roast[];
  stats: {
    total_violations: number;
    critical_issues: number;
    survival_rate: number;
  }
}

export async function getRepoDetails(repo_name: string): Promise<{ data: RepoDetails | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // 1. Fetch Repository
  const { data: repo, error: repo_error } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .eq('name', repo_name)
    .single();

  if (repo_error) {
    console.error('Error fetching repo:', repo_error);
    return { data: null, error: 'Repository not found' };
  }

  // 2. Fetch Roasts
  const { data: roasts, error: roasts_error } = await supabase
    .from('roasts')
    .select('*')
    .eq('repo_id', repo.id)
    .order('created_at', { ascending: false });

  if (roasts_error) {
    console.error('Error fetching roasts:', roasts_error);
    return { data: null, error: 'Failed to load roast history' };
  }

  // 3. Logic-Driven Statistics
  const total_violations = roasts.reduce((acc, r) => acc + (r.violations_count || 0), 0);
  const critical_issues = roasts.reduce((acc, r) => acc + (r.critical_issues_count || 0), 0);

  const pr_roasts = roasts.filter(r => r.pr_number !== null);
  const total_prs = pr_roasts.length;
  const pr_survivors = pr_roasts.filter(r => r.roast_score !== null && r.roast_score >= 7).length;

  const survival_rate = total_prs === 0 
    ? -1 
    : Math.round((pr_survivors / total_prs) * 100);

  console.log(`[Stats/${repo_name}] Violations:${total_violations} | Critical:${critical_issues} | PRs:${total_prs} | Survival:${survival_rate}%`);

  return {
    data: {
      ...repo,
      roasts: roasts as Roast[],
      stats: {
        total_violations,
        critical_issues,
        survival_rate
      }
    },
    error: null
  };
}
