'use server';

import { SupabaseClient, Session } from '@supabase/supabase-js';

/**
 * Gets a valid GitHub session with automatic refresh handling.
 * Uses getUser() which automatically refreshes expired sessions,
 * and falls back to refreshSession() if provider_token is missing.
 *
 * @param supabase - The Supabase client instance
 * @returns The session if valid, null otherwise
 */
export async function getValidGitHubSession(
  supabase: SupabaseClient
): Promise<Session | null> {
  // Use getUser() which automatically refreshes the session if needed
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Get the session (may have been refreshed by getUser)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  if (!session.provider_token) {
    // Try to refresh the session if token is missing
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error(
        '[getValidGitHubSession] Failed to refresh session:',
        refreshError
      );
      return null;
    }
    return refreshedSession || session;
  }

  return session;
}
