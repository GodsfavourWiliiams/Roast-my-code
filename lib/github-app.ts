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
  let privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY');
  }

  // Ensure standard PEM format by replacing literal \n with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  // Strip quotes if they were included in the string from .env
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
  }

  // Handle various .env formatting issues for PEM keys
  if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    // Maybe it is base64 encoded?
    try {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    } catch (e) {
      // Not base64, proceed
    }
  }

  // Final check to ensure it looks like a key
  if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.error('❌ CRITICAL: GITHUB_PRIVATE_KEY is NOT a valid PEM key.');
    console.error('It looks like you pasted a Fingerprint or SHA hash instead.');
    console.error('Please open the .pem file you downloaded from GitHub and copy its entire content.');
  }

  return new App({
    appId,
    privateKey,
    webhooks: {
      secret: process.env.GITHUB_WEBHOOK_SECRET || '',
    },
  });
};