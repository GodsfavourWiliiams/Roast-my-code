import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint to test if the webhook route is accessible
 * GET /api/webhooks/github/test
 */
export async function GET() {
  const checks = {
    route_accessible: true,
    environment: process.env.NODE_ENV || 'unknown',
    github_app_id: !!process.env.GITHUB_APP_ID,
    github_private_key: !!process.env.GITHUB_PRIVATE_KEY,
    github_webhook_secret: !!process.env.GITHUB_WEBHOOK_SECRET,
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    timestamp: new Date().toISOString(),
  };

  const allConfigured = 
    checks.github_app_id &&
    checks.github_private_key &&
    checks.github_webhook_secret &&
    checks.supabase_url &&
    checks.supabase_service_role;

  return NextResponse.json({
    status: allConfigured ? 'ok' : 'missing_config',
    message: allConfigured 
      ? 'Webhook route is accessible and all required environment variables are set'
      : 'Webhook route is accessible but some environment variables are missing',
    checks,
  });
}
