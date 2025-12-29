import { getGitHubApp } from "@/lib/github-app";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface GitHubWebhookPayload {
  action?: string;
  sender: {
    id: number;
  };
  installation?: {
    id: number;
  };
  repository?: {
    id: number;
    full_name: string;
  };
  pull_request?: {
    number: number;
  };
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const eventName = req.headers.get("x-github-event");
  
  // Initialize admin client inside handler to avoid build-time environment issues
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const app = getGitHubApp();
  
  try {
    await app.webhooks.verify(payload, signature);
    const event = JSON.parse(payload) as GitHubWebhookPayload;

    console.log(`[GitHub/Webhook] Received event: ${eventName}`);

    // Handle App Installation
    if (eventName === "installation" && event.installation) {
      const githubId = event.sender.id;
      const installationId = event.installation.id;
      const action = event.action;

      if (action === "created") {
        console.log(`[GitHub/Webhook] App installed by GitHub User ${githubId}. ID: ${installationId}`);
        // Link installation_id to the user who owns this GitHub ID
        const { error } = await supabaseAdmin
          .from('user_settings')
          .update({ installation_id: installationId })
          .eq('github_id', githubId);
          
        if (error) console.error("Failed to link installation:", error);
      } 
      
      if (action === "deleted") {
        console.log(`[GitHub/Webhook] App uninstalled by GitHub User ${githubId}`);
        const { error } = await supabaseAdmin
          .from('user_settings')
          .update({ installation_id: null })
          .eq('github_id', githubId);

        if (error) console.error("Failed to unlink installation:", error);
      }
    }

    // Handle Pull Requests
    if (eventName === "pull_request" && event.repository && event.pull_request) {
      const action = event.action;
      const repoGithubId = event.repository.id;
      const prNumber = event.pull_request.number;

      if (action === "opened" || action === "synchronize") {
        // 1. Find the repo in our DB
        const { data: repo } = await supabaseAdmin
            .from('repositories')
            .select('id, user_id, status')
            .eq('github_id', repoGithubId)
            .single();

        if (!repo) {
            console.log(`[GitHub/Webhook] Repo ${repoGithubId} not found in DB. Ignoring.`);
            return NextResponse.json({ message: "Repo not monitored" });
        }

        if (repo.status !== 'Running') {
            console.log(`[GitHub/Webhook] Repo is Paused. Ignoring.`);
            return NextResponse.json({ message: "Repo paused" });
        }

        // 2. Check if user has app installed (Redundant but safe)
        // We could also check user_settings here.

        console.log(`[GitHub/Webhook] Triggering Roast for PR #${prNumber}...`);
        // TODO: Call the Roast AI function here (server-side call, not via API route)
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[GitHub/Webhook] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid request" }, { status: 401 });
  }
}