'use server';

import { createClient } from '@/lib/supabase/server';
import { getGitHubApp } from '@/lib/github-app';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

export async function fetchRepoContents(
  repoFullName: string,
  path: string = ''
): Promise<{ data: FileNode[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  try {
    // 1. Get the installation_id for this user (fallback)
    const { data: settings } = await supabase
        .from('user_settings')
        .select('installation_id')
        .eq('user_id', user.id)
        .single();

    // 2. Resolve Installation ID dynamically
    const app = getGitHubApp();
    const [owner, repo] = repoFullName.split('/');
    let targetInstallationId = null;

    try {
        const { data: installation } = await app.octokit.request('GET /repos/{owner}/{repo}/installation', {
            owner,
            repo,
        });
        if (installation?.id) {
            targetInstallationId = installation.id;
        }
    } catch (e) {
        console.warn(`[fetchRepoContents] Could not lookup installation for ${repoFullName}`, e);
    }

    if (!targetInstallationId) {
        if (settings?.installation_id) {
            targetInstallationId = settings.installation_id;
        } else {
            return { data: null, error: 'REAUTH_REQUIRED' }; // App needs installation
        }
    }

    const octokit = await app.getInstallationOctokit(targetInstallationId);

    // 3. Fetch contents
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
    });

    if (!Array.isArray(data)) {
      return { data: null, error: 'Path is a file, not a directory' };
    }

    const files: FileNode[] = data
      .map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type as 'file' | 'dir',
        sha: item.sha,
      }))
      .sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });

    return { data: files, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching repo contents:', error);
    
    // Check if it's a 401/403 from GitHub specifically
    if (errorMessage.includes('401') || errorMessage.includes('Bad credentials')) {
        return { data: null, error: 'REAUTH_REQUIRED' };
    }
    
    return { data: null, error: errorMessage };
  }
}

export async function fetchFileContent(
  repoFullName: string,
  path: string
): Promise<{ content: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { content: null, error: 'Not authenticated' };
  }

  try {
    const { data: settings } = await supabase
        .from('user_settings')
        .select('installation_id')
        .eq('user_id', user.id)
        .single();

    const app = getGitHubApp();
    const [owner, repo] = repoFullName.split('/');
    let targetInstallationId = null;

    try {
        const { data: installation } = await app.octokit.request('GET /repos/{owner}/{repo}/installation', {
            owner,
            repo,
        });
        if (installation?.id) {
            targetInstallationId = installation.id;
        }
    } catch (e) {
        console.warn(`[fetchFileContent] Could not lookup installation for ${repoFullName}`, e);
    }

    if (!targetInstallationId) {
        if (settings?.installation_id) {
            targetInstallationId = settings.installation_id;
        } else {
            return { content: null, error: 'REAUTH_REQUIRED' };
        }
    }

    const octokit = await app.getInstallationOctokit(targetInstallationId);

    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
    });

    if (Array.isArray(data) || !('content' in data)) {
      return { content: null, error: 'Path is a directory, not a file' };
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching file content:', error);
    return { content: null, error: errorMessage };
  }
}