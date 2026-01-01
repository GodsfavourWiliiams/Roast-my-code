'use server';

import { createClient } from '@/lib/supabase/server';
import { getValidGitHubSession } from '@/lib/auth/session-utils';

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

  // Use getUser() which automatically refreshes expired sessions
  const session = await getValidGitHubSession(supabase);

  if (!session?.user) {
    return { data: null, error: 'Not authenticated' };
  }

  let providerToken = session.provider_token;
  if (!providerToken) {
    return {
      data: null,
      error: 'No GitHub token found. Please sign out and sign in again.',
    };
  }

  try {
    const [owner, repo] = repoFullName.split('/');

    // Use OAuth token (always available when logged in)
    // This works for all users, including new signups who don't have the app installed yet
    let response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // If token expired, try refreshing session and retry once
    if (response.status === 401 || response.status === 403) {
      console.log(
        '[fetchRepoContents] Token expired, attempting to refresh session...'
      );
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error(
          '[fetchRepoContents] Failed to refresh session:',
          refreshError
        );
      } else if (refreshedSession?.provider_token) {
        providerToken = refreshedSession.provider_token;
        // Retry the request with refreshed token
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            headers: {
              Authorization: `Bearer ${providerToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
      }
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { data: null, error: 'REAUTH_REQUIRED' };
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching repo contents:', error);

    // Check if it's a 401/403 from GitHub specifically
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('Bad credentials')
    ) {
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

  // Use getUser() which automatically refreshes expired sessions
  const session = await getValidGitHubSession(supabase);

  if (!session?.user) {
    return { content: null, error: 'Not authenticated' };
  }

  let providerToken = session.provider_token;
  if (!providerToken) {
    return {
      content: null,
      error: 'No GitHub token found. Please sign out and sign in again.',
    };
  }

  try {
    const [owner, repo] = repoFullName.split('/');

    // Use OAuth token (always available when logged in)
    // This works for all users, including new signups who don't have the app installed yet
    let response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // If token expired, try refreshing session and retry once
    if (response.status === 401 || response.status === 403) {
      console.log(
        '[fetchFileContent] Token expired, attempting to refresh session...'
      );
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error(
          '[fetchFileContent] Failed to refresh session:',
          refreshError
        );
      } else if (refreshedSession?.provider_token) {
        providerToken = refreshedSession.provider_token;
        // Retry the request with refreshed token
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            headers: {
              Authorization: `Bearer ${providerToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );
      }
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { content: null, error: 'REAUTH_REQUIRED' };
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (Array.isArray(data) || !('content' in data)) {
      return { content: null, error: 'Path is a directory, not a file' };
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, error: null };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching file content:', error);

    // Check if it's a 401/403 from GitHub specifically
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('Bad credentials')
    ) {
      return { content: null, error: 'REAUTH_REQUIRED' };
    }

    return { content: null, error: errorMessage };
  }
}