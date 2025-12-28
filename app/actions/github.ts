'use server';

import { createClient } from '@/lib/supabase/server';
import { GithubRepo } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function fetchGithubRepos({ search = '' }: { search?: string } = {}): Promise<{ repos: GithubRepo[]; error: string | null }> {
  const supabase = await createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated', repos: [] };
  }

  const providerToken = session.provider_token;

  if (!providerToken) {
    console.error("No provider token found in session");
    return { error: 'No GitHub token found. Please sign out and sign in again.', repos: [] };
  }

  try {
    const PER_PAGE = 20;
    let url = `https://api.github.com/user/repos?sort=updated&type=all&per_page=${PER_PAGE}`;

    if (search) {
      // For search, we need to know the username to restrict search to their repos
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: 'application/vnd.github.v3+json',
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const username = userData.login;
        // Search API
        // We assume the user wants to search their own repos (including private if scope allows)
        url = `https://api.github.com/search/repositories?q=${encodeURIComponent(search)}+user:${username}&per_page=${PER_PAGE}`;
      }
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${providerToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Search API returns { total_count, items: [] }, List API returns []
    const repos: GithubRepo[] = search ? data.items : data;
    
    return { repos, error: null };
  } catch (error) {
    console.error('Error fetching repos:', error);
    return { error: 'Failed to fetch repositories', repos: [] };
  }
}

export async function saveRepo(repo: GithubRepo) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('repositories')
        .upsert({
            user_id: user.id,
            github_id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            language: repo.language,
            url: repo.html_url,
            private: repo.private,
            status: 'Running',
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving repo:', error);
        return { error: error.message };
    }

    return { success: true };
}

export async function updateRepoStatus(repoId: number, status: 'Running' | 'Paused') {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('repositories')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('id', repoId); // Use our DB id, not github_id

    if (error) {
        console.error('Error updating repo status:', error);
        return { error: error.message };
    }
    
    revalidatePath('/dashboard/repos');
    return { success: true };
}

export async function deleteRepo(repoId: number) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('repositories')
        .delete()
        .eq('user_id', user.id)
        .eq('id', repoId);

    if (error) {
        console.error('Error deleting repo:', error);
        return { error: error.message };
    }
    
    revalidatePath('/dashboard/repos');
    return { success: true };
}

export interface SavedRepo {
    id: number;
    user_id: string;
    github_id: number;
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    url: string;
    private: boolean;
    status: 'Running' | 'Paused';
    created_at: string;
    updated_at: string;
}

export async function getSavedRepos(): Promise<{ repos: SavedRepo[]; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', repos: [] };

  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved repos:', error);
    return { error: error.message, repos: [] };
  }

  // Cast the data to the correct type since Supabase generic return type might not match exactly
  return { repos: data as SavedRepo[], error: null };
}