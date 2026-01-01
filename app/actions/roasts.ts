'use server';

import { createClient } from '@/lib/supabase/server';

export interface GlobalRoast {
  id: number;
  pr_title: string | null;
  pr_number: number | null;
  roast_content: string;
  roast_score: number | null;
  violations_count: number;
  critical_issues_count: number;
  created_at: string;
  repo_name: string;
}

interface RawRoast {
  id: number;
  pr_title: string | null;
  pr_number: number | null;
  roast_content: string;
  roast_score: number | null;
  violations_count: number;
  critical_issues_count: number;
  created_at: string;
  repositories: {
    name: string;
  } | null;
}

export async function getGlobalRoastHistory(params: { 
  search?: string; 
  filter?: string;
} = {}): Promise<{ roasts: GlobalRoast[]; error: string | null }> {
  const { search = '', filter = 'all' } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { roasts: [], error: 'Not authenticated' };

  let query = supabase
    .from('roasts')
    .select(`
      id,
      pr_title,
      pr_number,
      roast_content,
      roast_score,
      violations_count,
      critical_issues_count,
      created_at,
      repositories (
        name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<RawRoast[]>();

  // 1. Server-side Filtering by Intensity
  if (filter !== 'all') {
    if (filter === 'nuclear') {
        query = query.lte('roast_score', 3);
    } else if (filter === 'painful') {
        query = query.gt('roast_score', 3).lte('roast_score', 7);
    } else if (filter === 'nitpick') {
        query = query.gt('roast_score', 7);
    }
  }

  // 2. Server-side Search
  if (search) {
    // Search in PR Title or Repo Name
    // Note: To search across joins in Supabase, we use the !inner hint or filter strings
    query = query.or(`pr_title.ilike.%${search}%,repositories.name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching global history:', error);
    return { error: error.message, roasts: [] };
  }

  const formattedRoasts: GlobalRoast[] = (data || []).map((item) => {
    const repo = Array.isArray(item.repositories) ? item.repositories[0] : item.repositories;
    return {
      ...item,
      repo_name: repo?.name || 'Unknown Repo'
    };
  });

  return { roasts: formattedRoasts, error: null };
}