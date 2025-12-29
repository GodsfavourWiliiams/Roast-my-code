'use server';

import { createClient } from '@/lib/supabase/server';
import { getGitHubApp } from '@/lib/github-app';
import { revalidatePath } from 'next/cache';

export async function syncInstallation() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Strategy: Use the GitHub App (Bot) to find the installation for this user.
    // This is more reliable than asking the user's token to list all their installations.
    const app = getGitHubApp();
    
    // We need the user's GitHub username. 
    // We stored 'github_id' in user_settings, but we might not have the username.
    // Let's fetch the username using the user's token first (which we know works for 'read:user').
    
    const userRes = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${session.provider_token}`,
            Accept: 'application/vnd.github.v3+json',
        }
    });
    
    if (!userRes.ok) throw new Error("Failed to fetch GitHub user details");
    const githubUser = await userRes.json();
    const username = githubUser.login;
    const githubId = githubUser.id;

    // Now ask the Bot: "Do we have an installation for this user?"
    // API: GET /users/{username}/installation
    let installationId = null;
    try {
        const { data: installation } = await app.octokit.request('GET /users/{username}/installation', {
            username: username
        });
        installationId = installation.id;
    } catch (e) {
      const error = e as { status: number };
        if (error.status === 404) {
            return { success: false, error: 'App not installed on your GitHub account.' };
        }
        throw e;
    }

    if (!installationId) {
         return { success: false, error: 'Installation not found.' };
    }

    // Update Database
    const { error } = await supabase
        .from('user_settings')
        .upsert({ 
            user_id: session.user.id,
            github_id: githubId, // Ensure this is synced
            installation_id: installationId,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error("DB Update Error:", error);
        return { success: false, error: 'Failed to update database' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, installationId };

  } catch (error) {
    console.error('Sync Installation Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}