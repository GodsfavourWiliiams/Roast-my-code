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
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${providerToken}`,
            Accept: 'application/vnd.github.v3+json',
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const username = userData.login;
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
    const repos: GithubRepo[] = search ? data.items : data;
    
    return { repos, error: null };
  } catch (error: unknown) {
    console.error('Error fetching repos:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: message, repos: [] };
  }
}

export async function saveRepo(repo: GithubRepo) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated' };
  const user = session.user;

  // Fetch open PR count specifically
  let pending_murders = 0;
  try {
    const prResponse = await fetch(
      `https://api.github.com/search/issues?q=repo:${repo.full_name}+is:pr+is:open`,
      {
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (prResponse.ok) {
      const prData = await prResponse.json();
      pending_murders = prData.total_count;
    }
  } catch (e) {
    console.error('Failed to fetch PR count:', e);
  }

  // Detect Framework from package.json
  let framework = null;
  try {
    const packageJsonRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/contents/package.json`,
      {
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (packageJsonRes.ok) {
      const data = await packageJsonRes.json();
      if (data.content) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps['next']) framework = 'Next.js';
        else if (deps['react']) framework = 'React';
        else if (deps['vue']) framework = 'Vue';
        else if (deps['nuxt']) framework = 'Nuxt';
        else if (deps['@angular/core']) framework = 'Angular';
        else if (deps['svelte']) framework = 'Svelte';
        else if (deps['@nestjs/core']) framework = 'NestJS';
        else if (deps['express']) framework = 'Express';
        else if (deps['fastify']) framework = 'Fastify';
        else if (deps['koa']) framework = 'Koa';
        else if (deps['remix'] || deps['@remix-run/react']) framework = 'Remix';
        else if (deps['gatsby']) framework = 'Gatsby';
        else if (deps['@sveltejs/kit']) framework = 'SvelteKit';
        else if (deps['astro']) framework = 'Astro';
        else if (deps['solid-js']) framework = 'SolidJS';
        else if (deps['preact']) framework = 'Preact';
        else if (deps['vite']) framework = 'Vite';
        else if (deps['webpack']) framework = 'Webpack';
        else if (deps['rollup']) framework = 'Rollup';
        else if (deps['parcel']) framework = 'Parcel';
      }
    }

    // Check for Python frameworks
    if (!framework) {
      try {
        const requirementsRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/requirements.txt`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (requirementsRes.ok) {
          const pyprojectRes = await fetch(
            `https://api.github.com/repos/${repo.full_name}/contents/pyproject.toml`,
            {
              headers: {
                Authorization: `Bearer ${session.provider_token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );
          if (pyprojectRes.ok) {
            const data = await pyprojectRes.json();
            if (data.content) {
              const content = Buffer.from(data.content, 'base64').toString(
                'utf-8'
              );
              if (content.includes('django')) framework = 'Django';
              else if (content.includes('flask')) framework = 'Flask';
              else if (content.includes('fastapi')) framework = 'FastAPI';
              else framework = 'Python';
            }
          } else {
            framework = 'Python';
          }
        }
      } catch {
        // Ignore errors for optional checks
      }
    }

    // Check for Ruby/Rails
    if (!framework) {
      try {
        const gemfileRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/Gemfile`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (gemfileRes.ok) {
          const data = await gemfileRes.json();
          if (data.content) {
            const content = Buffer.from(data.content, 'base64').toString(
              'utf-8'
            );
            if (content.includes('rails')) framework = 'Rails';
            else framework = 'Ruby';
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Check for PHP/Laravel
    if (!framework) {
      try {
        const composerRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/composer.json`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (composerRes.ok) {
          const data = await composerRes.json();
          if (data.content) {
            const content = Buffer.from(data.content, 'base64').toString(
              'utf-8'
            );
            const pkg = JSON.parse(content);
            const deps = { ...pkg.require, ...pkg['require-dev'] };
            if (deps['laravel/framework']) framework = 'Laravel';
            else framework = 'PHP';
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Check for Java/Spring
    if (!framework) {
      try {
        const pomRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/pom.xml`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (pomRes.ok) {
          const data = await pomRes.json();
          if (data.content) {
            const content = Buffer.from(data.content, 'base64').toString(
              'utf-8'
            );
            if (
              content.includes('spring-boot') ||
              content.includes('springframework')
            )
              framework = 'Spring';
            else framework = 'Java';
          }
        }
      } catch {
        // Ignore errors
      }
    }

    // Check for Go
    if (!framework) {
      try {
        const goModRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/go.mod`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (goModRes.ok) framework = 'Go';
      } catch {
        // Ignore errors
      }
    }

    // Check for Rust
    if (!framework) {
      try {
        const cargoRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/Cargo.toml`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
        if (cargoRes.ok) framework = 'Rust';
      } catch {
        // Ignore errors
      }
    }
      } catch (e) {
      console.error('Failed to detect framework:', e);
    }
  
    // Fetch user settings for default status
    const { data: settings } = await supabase
      .from('user_settings')
      .select('auto_run_new_repos, installation_id')
      .eq('user_id', user.id)
      .single();
  
      // Default status: Run if setting is true AND app is installed. Otherwise Idle (not Paused).
      const initialStatus =
        settings?.auto_run_new_repos && settings?.installation_id
          ? 'Running'
          : 'Idle';
    
      const { error: upsertError } = await supabase      .from('repositories')
      .upsert({
        user_id: user.id,
        github_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
              language: repo.language,
              framework: framework,
              url: repo.html_url,
              default_branch: repo.default_branch || 'main',
              private: repo.private,        status: initialStatus,
        open_prs_count: pending_murders,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
  
    if (upsertError) {
      console.error('Error saving repo:', upsertError);
      return { error: upsertError.message };
    }
  return { success: true };
}

export async function updateRepoStatus(
  repoId: number,
  status: 'Running' | 'Paused'
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('repositories')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('id', repoId);

  if (error) {
    console.error('Error updating repo status:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/repos');
  return { success: true };
}

export async function deleteRepo(repoId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  framework: string | null;
  url: string;
  default_branch: string;
  private: boolean;
  status: 'Running' | 'Paused' | 'Idle' | 'Deleted';
  open_prs_count: number;
  created_at: string;
  updated_at: string;
}

export async function getSavedRepos({ search = '', filter = 'all' }: { search?: string; filter?: string } = {}): Promise<{ repos: SavedRepo[]; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', repos: [] };

  let query = supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (filter !== 'all') {
    const status = filter.charAt(0).toUpperCase() + filter.slice(1);
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching saved repos:', error);
    return { error: error.message, repos: [] };
  }

  return { repos: data as SavedRepo[], error: null };
}
