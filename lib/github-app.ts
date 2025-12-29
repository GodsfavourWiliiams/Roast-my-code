import { App } from "octokit";

/**
 * Initialize the GitHub App instance.
 * These environment variables must be set in .env.local:
 * - GITHUB_APP_ID: Found in your GitHub App settings.
 * - GITHUB_PRIVATE_KEY: The contents of the .pem file you downloaded.
 * - GITHUB_WEBHOOK_SECRET: The secret you entered in the form.
 */
export const getGitHubApp = () => {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY");
  }

  return new App({
    appId,
    privateKey: privateKey.replace(/\\n/g, '\n'), // Handle newlines if key is stringified
    webhooks: {
      secret: process.env.GITHUB_WEBHOOK_SECRET || "",
    },
  });
};
