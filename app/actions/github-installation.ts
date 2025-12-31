'use server';

import { createClient } from '@/lib/supabase/server';
import { getGitHubApp } from '@/lib/github-app';
import { revalidatePath } from 'next/cache';

/**
 * Type guard for GitHub/Octokit errors
 */
function isGitHubError(error: unknown): error is { status: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: number }).status === 'number'
  );
}

export async function syncInstallation() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const app = getGitHubApp();

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) throw new Error('Failed to fetch GitHub user details');
    const githubUser = await userRes.json();
    const username = githubUser.login;
    const githubId = githubUser.id;

    let installationId = null;
    try {
      const { data: installation } = await app.octokit.request(
        'GET /users/{username}/installation',
        {
          username: username,
        }
      );
      installationId = installation.id;
    } catch (e: unknown) {
      if (isGitHubError(e) && e.status === 404) {
        return {
          success: false,
          error: 'App not installed on your GitHub account.',
        };
      }
      throw e;
    }

    if (!installationId) {
      return { success: false, error: 'Installation not found.' };
    }

    const { error } = await supabase.from('user_settings').upsert({
      user_id: session.user.id,
      github_id: githubId,
      installation_id: installationId,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('DB Update Error:', error);
      return { success: false, error: 'Failed to update database' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, installationId };
  } catch (error: unknown) {
    console.error('Sync Installation Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
