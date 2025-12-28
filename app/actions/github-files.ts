'use server';

import { createClient } from '@/lib/supabase/server';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

export async function fetchRepoContents(repoFullName: string, path: string = ''): Promise<{ data: FileNode[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    return { data: null, error: 'Not authenticated with GitHub' };
  }

  try {
    const url = `https://api.github.com/repos/${repoFullName}/contents/${path}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      console.error("GitHub API Error:", errorBody);
      throw new Error(errorBody.message || `GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        // If it's a single file (not a directory), GitHub returns an object, not an array.
        // We shouldn't really hit this if our logic is correct (we click files to roast, folders to expand),
        // but handling it is safe.
        return { data: null, error: 'Path is a file, not a directory' };
    }

    const files: FileNode[] = data.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      sha: item.sha,
    })).sort((a, b) => {
        // Folders first
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    return { data: files, error: null };
  } catch (error: any) {
    console.error('Error fetching repo contents:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchFileContent(repoFullName: string, path: string): Promise<{ content: string | null; error: string | null }> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
  
    if (!session?.provider_token) {
      return { content: null, error: 'Not authenticated with GitHub' };
    }
  
    try {
      const url = `https://api.github.com/repos/${repoFullName}/contents/${path}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
  
      const data = await response.json();
      
      // GitHub returns content encoded in base64
      if (!data.content) {
          return { content: null, error: 'No content found' };
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { content, error: null };
    } catch (error: any) {
      console.error('Error fetching file content:', error);
      return { content: null, error: error.message };
    }
}
