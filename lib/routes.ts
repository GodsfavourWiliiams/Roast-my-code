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
    GITHUB_APP_INSTALL: (appName: string) => `https://github.com/apps/${appName}/installations/new`,
    GITHUB_REPO: (fullName: string) => `https://github.com/${fullName}`,
    GITHUB_EDIT: (fullName: string, branch: string, filename: string) => 
      `https://github.com/${fullName}/edit/${branch}/${filename}`,
  }
};
