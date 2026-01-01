import { getGitHubApp } from "@/lib/github-app";
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { processAutomatedRoast, processReply } from "@/app/actions/roast-logic";

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
  comment?: {
    id: number;
    body: string;
    user: {
        login: string;
    };
  };
  issue?: {
    number: number;
    title: string;
    pull_request?: object;
  };
}

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";
    const eventName = req.headers.get("x-github-event");
    const now = new Date().toISOString();
    
    console.log(`[GitHub/Webhook] [${now}] Incoming event: ${eventName}`);

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
    await app.webhooks.verify(payload, signature);
    const event = JSON.parse(payload) as GitHubWebhookPayload;

    // Handle User Replies
    if (eventName === "issue_comment" && event.action === "created" && event.issue?.pull_request && event.comment) {
        const commentBody = event.comment.body.toLowerCase();
        const isMentioned = commentBody.includes('roastbot');
        const userLogin = event.comment.user.login;
        
        console.log(`[GitHub/Webhook] Comment by ${userLogin}: "${commentBody}" | Mentioned: ${isMentioned}`);

        if (isMentioned) {
            console.log(`[GitHub/Webhook] Bot mentioned. Evaluating intent...`);
            const repoGithubId = event.repository!.id;
            const prNumber = event.issue.number;

            const { data: repo } = await supabaseAdmin
                .from('repositories')
                .select('id, user_id, status')
                .eq('github_id', repoGithubId)
                .single();

            if (repo) {
                // Fetch user settings for persona
                const { data: settings } = await supabaseAdmin
                    .from('user_settings')
                    .select('persona')
                    .eq('user_id', repo.user_id)
                    .single();

                const persona = settings?.persona || 'toxic';
                const wantsRoast = commentBody.includes('ready') || 
                                   commentBody.includes('fixed') || 
                                   commentBody.includes('done') || 
                                   commentBody.includes('roast') ||
                                   commentBody.includes('review');

                if (wantsRoast) {
                    console.log(`[GitHub/Webhook] User requested a re-roast for PR #${prNumber}.`);
                    
                    const octokit = await app.getInstallationOctokit(event.installation!.id);
                    
                    // 1. Immediate GitHub acknowledgement
                    const acknowledgment = persona === 'toxic' ? "Fine, I'm looking. Try not to break anything else while I'm gone." :
                                          persona === 'shakespearean' ? "By my troth, I shall inspect thy scrolls forthwith." :
                                          persona === 'honest' ? "I'm starting the review now. One moment." :
                                          "I'm on it. Processing your request...";

                    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                        owner: event.repository!.owner.login,
                        repo: event.repository!.name,
                        issue_number: prNumber,
                        body: acknowledgment,
                    });

                    // 2. Immediate In-App Notification
                    await supabaseAdmin.from('notifications').insert({
                        user_id: repo.user_id,
                        title: 'Analysis Started',
                        message: `RoastBot is currently dissecting PR #${prNumber} in ${event.repository!.name}.`,
                        type: 'info',
                        link: `/dashboard/repos/${event.repository!.name}`
                    });

                    // 3. Trigger the actual roast
                    await triggerAutomatedRoast(app, supabaseAdmin, event, repo, prNumber);
                } else {
                    console.log(`[GitHub/Webhook] Standard reply requested.`);
                    const reply = await processReply({
                        user_id: repo.user_id,
                        repo_name: event.repository!.full_name,
                        pr_number: prNumber,
                        user_comment: event.comment!.body,
                        user_login: userLogin
                    });

                    const octokit = await app.getInstallationOctokit(event.installation!.id);
                    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                        owner: event.repository!.owner.login,
                        repo: event.repository!.name,
                        issue_number: prNumber,
                        body: reply,
                    });
                }
            }
        }
    }

    // Handle App Installation
    if (eventName === "installation" && event.installation) {
      const githubId = event.sender.id;
      const installationId = event.installation.id;
      const action = event.action;

      if (action === "created") {
        console.log(`[GitHub/Webhook] App installed by GitHub User ${githubId}. ID: ${installationId}`);
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
                await supabaseAdmin.from('notifications').insert({
                    user_id: repo.user_id,
                    title: 'Repository Deleted on GitHub',
                    message: `The repository ${repo.name} was deleted on GitHub. Analysis has been stopped.`, 
                    type: 'error'
                });

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

      const { data: repo } = await supabaseAdmin
        .from('repositories')
        .select('id, user_id, status, open_prs_count')
        .eq('github_id', repoGithubId)
        .single();

      if (!repo) {
        console.log(`[GitHub/Webhook] Repo ${repoGithubId} not found in DB. Ignoring.`);
        return NextResponse.json({ message: "Repo not monitored" });
      }

      if (action === "opened" || action === "closed" || action === "reopened" || action === "synchronize") {
          console.log(`[GitHub/Webhook] Syncing metadata and PR count for ${repo.id}. Action: ${action}`);
          
          try {
              const octokit = await app.getInstallationOctokit(event.installation!.id);
              const { data: repoData } = await octokit.request('GET /repos/{owner}/{repo}', {
                  owner: event.repository.owner.login,
                  repo: event.repository.name,
              });

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

      if (action === "opened" || action === "reopened") {
        if (repo.status !== 'Running') {
          console.log(`[GitHub/Webhook] Repo status is ${repo.status}. Ignoring roast trigger.`);

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

        await triggerAutomatedRoast(app, supabaseAdmin, event, repo, prNumber);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[GitHub/Webhook] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid request" }, { status: 401 });
  }
}

async function triggerAutomatedRoast(
    app: ReturnType<typeof getGitHubApp>, 
    supabaseAdmin: SupabaseClient, 
    event: GitHubWebhookPayload, 
    repo: { id: number; user_id: string; status: string }, 
    prNumber: number
) {
    console.log(`[GitHub/Webhook] Starting Automated Roast logic for PR #${prNumber}...`);

    if (!event.repository) return;      
    
    // Determine the PR title from either the PR event or the Issue (Comment) event
    const prTitle = event.pull_request?.title || event.issue?.title || `PR #${prNumber}`;

    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('installation_id')
      .eq('user_id', repo.user_id)
      .single();

    if (!settings?.installation_id) {
      console.error('[GitHub/Webhook] No installation found for user. Cannot roast.');
      return;
    }

    try {
      const octokit = await app.getInstallationOctokit(settings.installation_id);

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
      const MAX_DIFF_SIZE = 100000;
      let processedCode = diff;
      let wasTruncated = false;

      if (diff.length > MAX_DIFF_SIZE) {
          processedCode = diff.substring(0, MAX_DIFF_SIZE);
          wasTruncated = true;
      }

      const roast = await processAutomatedRoast({
          repo_id: repo.id,
          user_id: repo.user_id,
          pr_number: prNumber,
          pr_title: prTitle,
          repo_full_name: event.repository.full_name,
          code: processedCode,
          was_truncated: wasTruncated,
      });

      const reviewEvent = roast.should_block ? 'REQUEST_CHANGES' : 'APPROVE';
      
      await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          body: `## 💀 RoastBot Autopsy Report\n\n${roast.text}\n\n---\n*Sent with attitude by RoastBot*`,
          event: reviewEvent
      });

      console.log(`[GitHub/Webhook] Roast ${reviewEvent} posted successfully.`);
    } catch (e: unknown) {
      console.error('[GitHub/Webhook] Roast execution failed:', e);
    }
}