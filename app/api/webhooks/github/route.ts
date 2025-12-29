import { getGitHubApp } from "@/lib/github-app";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  
  const app = getGitHubApp();
  
  try {
    // 1. Verify the signature to ensure this came from GitHub
    await app.webhooks.verify(payload, signature);
    
    // 2. Parse the event
    const event = JSON.parse(payload);
    const eventName = req.headers.get("x-github-event");

    console.log(`[GitHub/Webhook] Received event: ${eventName}`);

    // 3. Handle specific events
    if (eventName === "pull_request") {
      const action = event.action; // opened, synchronize, closed, etc.
      const prNumber = event.pull_request.number;
      const repoFullName = event.repository.full_name;

      console.log(`[GitHub/Webhook] PR #${prNumber} ${action} in ${repoFullName}`);

      if (action === "opened" || action === "synchronize") {
        // This is where we will trigger the automated roast later
        console.log(`[GitHub/Webhook] Triggering automated roast for PR #${prNumber}...`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[GitHub/Webhook] Verification failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
}
