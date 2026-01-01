import { getGitHubApp } from "@/lib/github-app";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processAutomatedRoast } from "@/app/actions/roast-logic";

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
    name: string;
    description: string | null;
    html_url: string;
    owner: {
        login: string;
    };
  };
  pull_request?: {
    number: number;
    title: string;
    html_url: string;
  };
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";
  const eventName = req.headers.get("x-github-event");
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
      console.error("[GitHub/Webhook] Error: SUPABASE_SERVICE_ROLE_KEY is missing. Webhook cannot update database.");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  // Initialize admin client inside handler to avoid build-time environment issues
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
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
          .update({ installation_id: null, suspended: false })
          .eq('github_id', githubId);

        if (error) console.error("Failed to unlink installation:", error);
      }

      if (action === "suspend") {
        console.log(`[GitHub/Webhook] App suspended by GitHub User ${githubId}`);
        await supabaseAdmin.from('user_settings').update({ suspended: true }).eq('github_id', githubId);
      }

      if (action === "unsuspend") {
        console.log(`[GitHub/Webhook] App unsuspended by GitHub User ${githubId}`);
        await supabaseAdmin.from('user_settings').update({ suspended: false }).eq('github_id', githubId);
      }
    }

    // Handle Repository Events (Rename, Delete)
    if (eventName === "repository" && event.repository) {
        const action = event.action;
        const repoGithubId = event.repository.id;

        if (action === "renamed" || action === "edited") {
            console.log(`[GitHub/Webhook] Repo updated: ${event.repository.full_name}`);
            await supabaseAdmin
                .from('repositories')
                .update({
                    name: event.repository.name,
                    full_name: event.repository.full_name,
                    description: event.repository.description,
                    url: event.repository.html_url,
                    updated_at: new Date().toISOString()
                })
                .eq('github_id', repoGithubId);
        }

        if (action === "deleted") {
            console.log(`[GitHub/Webhook] Repo deleted on GitHub: ${event.repository.full_name}`);
            
            const { data: repo } = await supabaseAdmin
                .from('repositories')
                .select('user_id, name')
                .eq('github_id', repoGithubId)
                .single();

            if (repo) {
                // Notify User
                await supabaseAdmin.from('notifications').insert({
                    user_id: repo.user_id,
                    title: 'Repository Deleted on GitHub',
                    message: `The repository ${repo.name} was deleted on GitHub. Analysis has been stopped.`,
                    type: 'error'
                });

                // Mark as Deleted in DB instead of physical delete
                await supabaseAdmin
                    .from('repositories')
                    .update({ 
                        status: 'Deleted',
                        updated_at: new Date().toISOString()
                    })
                    .eq('github_id', repoGithubId);
            }
        }
    }

    // Handle Pull Requests
    if (eventName === "pull_request" && event.repository && event.pull_request) {
      const action = event.action;
      const repoGithubId = event.repository.id;
      const prNumber = event.pull_request.number;
      
      console.log(`[GitHub/Webhook] Processing Pull Request #${prNumber} action: ${action}`);

      // 1. Find the repo in our DB
      const { data: repo } = await supabaseAdmin
        .from('repositories')
        .select('id, user_id, status, open_prs_count')
        .eq('github_id', repoGithubId)
        .single();

      if (!repo) {
        console.log(`[GitHub/Webhook] Repo ${repoGithubId} not found in DB. Ignoring.`);
        return NextResponse.json({ message: "Repo not monitored" });
      }

      // 2. Update Repo Metadata and PR Count on Open/Close/Sync (DO THIS ALWAYS)
      if (action === "opened" || action === "closed" || action === "reopened" || action === "synchronize") {
          console.log(`[GitHub/Webhook] Syncing metadata and PR count for ${repo.id}. Action: ${action}`);
          
          try {
              const octokit = await app.getInstallationOctokit(event.installation!.id);
              
              // Fetch fresh repo details
              const { data: repoData } = await octokit.request('GET /repos/{owner}/{repo}', {
                  owner: event.repository.owner.login,
                  repo: event.repository.name,
              });

              // Fetch fresh open PR count
              const { data: openPulls } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
                  owner: event.repository.owner.login,
                  repo: event.repository.name,
                  state: 'open',
                  per_page: 100 
              });
              
              const prCount = openPulls.length;
              
              await supabaseAdmin
                .from('repositories')
                .update({ 
                    name: repoData.name,
                    full_name: repoData.full_name,
                    description: repoData.description,
                    language: repoData.language,
                    url: repoData.html_url,
                    open_prs_count: prCount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', repo.id);
                
              console.log(`[GitHub/Webhook] Sync complete. PR count: ${prCount}`);
          } catch (e) {
              console.error("[GitHub/Webhook] Failed to sync repo details:", e);
          }
      }

      // 3. Automated Roasting (ONLY IF RUNNING)
      if (action === "opened" || action === "synchronize" || action === "reopened") {
        if (repo.status !== 'Running') {
          console.log(`[GitHub/Webhook] Repo status is ${repo.status}. Ignoring roast trigger.`);

          // Send Notification (Only on OPEN or REOPEN to avoid spam)
          if (action === 'opened' || action === 'reopened') {
            await supabaseAdmin.from('notifications').insert({
              user_id: repo.user_id,
              title: 'Roast Skipped',
              message: `A PR (#${prNumber}) was ${action} in ${event.repository.full_name}, but the bot is currently ${repo.status}. Unpause it to resume analysis.`,
              type: 'warning',
              link: `/dashboard/repos/${event.repository.name}`,
            });
          }

          return NextResponse.json({ message: `Repo ${repo.status}` });
        }

        console.log(`[GitHub/Webhook] Triggering Roast for PR #${prNumber}...`);

        // Get Installation ID for the user
        const { data: settings } = await supabaseAdmin
          .from('user_settings')
          .select('installation_id')
          .eq('user_id', repo.user_id)
          .single();

        if (!settings?.installation_id) {
          console.error(
            '[GitHub/Webhook] No installation found for user. Cannot roast.'
          );
          return NextResponse.json({ error: 'No installation' });
        }

        const MAX_CHAR_LIMIT = 50000; // 50K characters limit (approx 12.5k tokens)

        try {
          // 1. Get Octokit for this installation
          const octokit = await app.getInstallationOctokit(
            settings.installation_id
          );

                      // 2. Fetch the PR Diff

                      const { data: rawDiff } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {

                          owner: event.repository.owner.login,

                          repo: event.repository.name,

                          pull_number: prNumber,

                          headers: {

                              accept: 'application/vnd.github.v3.diff',

                          },

                      });

          

                      const diff = rawDiff as unknown as string;

                      const MAX_DIFF_SIZE = 100000; // 100k chars limit

                      let processedCode = diff;

                      let wasTruncated = false;

          

                      if (diff.length > MAX_DIFF_SIZE) {

                          processedCode = diff.substring(0, MAX_DIFF_SIZE);

                          wasTruncated = true;

                          console.warn(`[GitHub/Webhook] PR #${prNumber} diff truncated from ${diff.length} to ${MAX_DIFF_SIZE} chars.`);

                      }

          

                      // 3. Process the Roast (AI + DB Save)

                      const roast = await processAutomatedRoast({

                          repo_id: repo.id,

                          user_id: repo.user_id,

                          pr_number: prNumber,

                          pr_title: event.pull_request.title,

                          repo_full_name: event.repository.full_name,

                          code: processedCode,

                          was_truncated: wasTruncated,

                      });

          // 4. Post Comment to GitHub
          await octokit.request(
            'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
            {
              owner: event.repository.owner.login,
              repo: event.repository.name,
              issue_number: prNumber,
              body: `## 💀 RoastBot Autopsy Report\n\n${roast.text}\n\n---\n*Sent with attitude by RoastBot*`,
            }
          );

          console.log(
            `[GitHub/Webhook] Roast posted successfully for PR #${prNumber}`
          );
        } catch (e: unknown) {
          console.error('[GitHub/Webhook] Roast execution failed:', e);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[GitHub/Webhook] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid request" }, { status: 401 });
  }
}