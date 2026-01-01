/**
 * Centralized route configuration for the application.
 * Use these constants instead of hardcoded strings to prevent broken links.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: {
    HOME: '/dashboard',
    REPOS: '/dashboard/repos',
    REPO_DETAILS: (name: string) => `/dashboard/repos/${encodeURIComponent(name)}`,
    ROASTS: '/dashboard/roasts',
    SETTINGS: '/dashboard/settings',
  },
  API: {
    ROAST: '/api/roast',
    WEBHOOK_GITHUB: '/api/webhooks/github',
  },
  EXTERNAL: {
    // Use for initial installation or forcing a reinstall flow (public link)
    GITHUB_APP_INITIAL_INSTALL: (appName: string) => 
      `https://github.com/apps/${appName}/installations/new`,
    // Use for managing existing installations (requires user to be app owner/admin)
    GITHUB_APP_MANAGE_INSTALL: (installationId: number) => 
      `https://github.com/settings/installations/${installationId}`,
    GITHUB_REPO: (fullName: string) => `https://github.com/${fullName}`,
    GITHUB_EDIT: (fullName: string, branch: string, filename: string) => 
      `https://github.com/${fullName}/edit/${branch}/${filename}`,
  }
};
