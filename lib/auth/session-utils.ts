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

/**
 * Makes a GitHub API request with automatic token refresh and retry.
 * Handles 401/403 errors by refreshing the session and retrying once.
 *
 * @param supabase - The Supabase client instance
 * @param url - The GitHub API URL
 * @param options - Optional fetch options
 * @returns The Response object
 */
export async function fetchGitHubAPI(
  supabase: SupabaseClient,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get initial session
  const session = await getValidGitHubSession(supabase);
  if (!session?.provider_token) {
    throw new Error('No valid GitHub token available');
  }

  // Make initial request
  let response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.provider_token}`,
      Accept: 'application/vnd.github.v3+json',
      ...options.headers,
    },
  });

  // If token expired, refresh and retry once
  if (response.status === 401 || response.status === 403) {
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (refreshError || !refreshedSession?.provider_token) {
      return response; // Return original error response
    }

    // Retry with refreshed token
    response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${refreshedSession.provider_token}`,
        Accept: 'application/vnd.github.v3+json',
        ...options.headers,
      },
    });
  }

  return response;
}
