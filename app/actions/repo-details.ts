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

  // 1. Fetch the Repository by Name (and ensure it belongs to the user)
  // We match on 'name' because that's what's in the URL parameter
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

  // 2. Fetch the Roasts for this Repository
  const { data: roasts, error: roastsError } = await supabase
    .from('roasts')
    .select('*')
    .eq('repo_id', repo.id)
    .order('created_at', { ascending: false });

  if (roastsError) {
    console.error('Error fetching roasts:', roastsError);
    return { data: null, error: 'Failed to load roast history' };
  }

  // 3. Calculate Stats (Mock logic for now, utilizing real data counts)
  // In a real LLM scenario, "Critical Issues" might be a count of roasts with score > 8
  const totalViolations = roasts.length;
  
  // Let's say any roast with score >= 8 is a "Critical Issue"
  const criticalIssues = roasts.filter(r => (r.roast_score || 0) >= 8).length;

  // Survival Rate: Percentage of PRs (roasts) with score < 5 (Low impact)
  // If 0 roasts, survival is 100% (innocent until proven guilty)
  const survivalRate = totalViolations === 0 
    ? 100 
    : Math.round((roasts.filter(r => (r.roast_score || 0) < 5).length / totalViolations) * 100);

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
