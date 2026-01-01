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
        console.error("[GitHub/Webhook] Error: SUPABASE_SERVICE_ROLE_KEY is missing.");
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    const app = getGitHubApp();
    await app.webhooks.verify(payload, signature);
    const event = JSON.parse(payload) as GitHubWebhookPayload;

    // 1. Handle User Replies (Mentions)
    if (eventName === "issue_comment" && event.action === "created" && event.issue?.pull_request && event.comment) {
        const commentBody = event.comment.body.toLowerCase();
        const isMentioned = commentBody.includes('roastbot');
        const userLogin = event.comment.user.login;
        const isNotBot = !userLogin.includes('[bot]'); // Prevent self-roasting loop

        if (isMentioned && isNotBot) {
            const repoGithubId = event.repository!.id;
            const prNumber = event.issue.number;

            const { data: repo } = await supabaseAdmin
                .from('repositories')
                .select('id, user_id, status')
                .eq('github_id', repoGithubId)
                .single();

            if (repo) {
                const { data: settings } = await supabaseAdmin
                    .from('user_settings')
                    .select('persona')
                    .eq('user_id', repo.user_id)
                    .single();

                const persona = settings?.persona || 'toxic';
                const wantsRoast = commentBody.includes('ready') || commentBody.includes('fixed') || commentBody.includes('done') || commentBody.includes('roast') || commentBody.includes('review');

                if (wantsRoast) {
                    const octokit = await app.getInstallationOctokit(event.installation!.id);
                    const acknowledgment = persona === 'toxic' ? "Fine, I'm looking. Try not to break anything else while I'm gone." :
                                          persona === 'shakespearean' ? "By my troth, I shall inspect thy scrolls forthwith." :
                                          "I'm starting the review now. One moment.";

                    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                        owner: event.repository!.owner.login,
                        repo: event.repository!.name,
                        issue_number: prNumber,
                        body: acknowledgment,
                    });

                    // Start notification
                    await supabaseAdmin.from('notifications').insert({
                        user_id: repo.user_id,
                        title: 'Analysis Started',
                        message: `RoastBot is currently dissecting PR #${prNumber} in ${event.repository!.name}.`,
                        type: 'info',
                        link: `/dashboard/repos/${event.repository!.name}`
                    });

                    await triggerAutomatedRoast(app, supabaseAdmin, event, repo, prNumber);
                } else {
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

    // 2. Handle Pull Request Events
    if (eventName === "pull_request" && event.repository && event.pull_request) {
      const action = event.action;
      const repoGithubId = event.repository.id;
      const prNumber = event.pull_request.number;
      
      const { data: repo } = await supabaseAdmin
        .from('repositories')
        .select('id, user_id, status, open_prs_count')
        .eq('github_id', repoGithubId)
        .single();

      if (!repo) return NextResponse.json({ message: "Repo not monitored" });

      // Always sync metadata on PR changes
      if (action === "opened" || action === "closed" || action === "reopened" || action === "synchronize") {
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
              
              await supabaseAdmin.from('repositories').update({
                    name: repoData.name,
                    full_name: repoData.full_name,
                    description: repoData.description,
                    language: repoData.language,
                    url: repoData.html_url,
                    open_prs_count: openPulls.length,
                    updated_at: new Date().toISOString()
                }).eq('id', repo.id);
          } catch (e) { console.error("Sync failed", e); }
      }

      if (action === "opened" || action === "reopened") {
        if (repo.status === 'Running') {
            await triggerAutomatedRoast(app, supabaseAdmin, event, repo, prNumber);
        } else {
            // Notify roast skipped
            await supabaseAdmin.from('notifications').insert({
              user_id: repo.user_id,
              title: 'Roast Skipped',
              message: `PR #${prNumber} was ${action}, but the bot is ${repo.status}.`,
              type: 'warning',
              link: `/dashboard/repos/${event.repository.name}`,
            });
        }
      }
    }

    // 3. Handle Installation Events
    if (eventName === "installation" && event.installation) {
        const githubId = event.sender.id;
        const installationId = event.installation.id;
        const action = event.action;

        if (action === "created") {
            await supabaseAdmin.from('user_settings').update({ installation_id: installationId }).eq('github_id', githubId);
        } else if (action === "deleted") {
            await supabaseAdmin.from('user_settings').update({ installation_id: null, suspended: false }).eq('github_id', githubId);
        } else if (action === "suspend") {
            await supabaseAdmin.from('user_settings').update({ suspended: true }).eq('github_id', githubId);
        } else if (action === "unsuspend") {
            await supabaseAdmin.from('user_settings').update({ suspended: false }).eq('github_id', githubId);
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
    if (!event.repository) return;      
    const { data: settings } = await supabaseAdmin.from('user_settings').select('installation_id').eq('user_id', repo.user_id).single();
    if (!settings?.installation_id) return;

    try {
      const octokit = await app.getInstallationOctokit(settings.installation_id);
      const { data: rawDiff } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          headers: { accept: 'application/vnd.github.v3.diff' },
      });

      const diff = rawDiff as unknown as string;
      const MAX_DIFF_SIZE = 100000;
      const processedCode = diff.length > MAX_DIFF_SIZE ? diff.substring(0, MAX_DIFF_SIZE) : diff;

      const roast = await processAutomatedRoast({
          repo_id: repo.id,
          user_id: repo.user_id,
          pr_number: prNumber,
          pr_title: event.pull_request?.title || event.issue?.title || "PR",
          repo_full_name: event.repository.full_name,
          code: processedCode,
          was_truncated: diff.length > MAX_DIFF_SIZE,
      });

      const reviewEvent = roast.should_block ? 'REQUEST_CHANGES' : 'APPROVE';
      
      await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          body: `## 💀 RoastBot Autopsy Report\n\n${roast.text}\n\n---\n*Sent with attitude by RoastBot*`,
          event: reviewEvent
      });

      // RESTORED: Final Completion Notification
      await supabaseAdmin.from('notifications').insert({
          user_id: repo.user_id,
          title: roast.should_block ? '🛑 PR Merge Blocked' : '✅ Roast Completed',
          message: roast.should_block 
              ? `PR #${prNumber} has critical issues and cannot be merged.` 
              : `PR #${prNumber} has been reviewed. Score: ${roast.score}/10`,
          type: roast.should_block ? 'error' : 'success',
          link: `/dashboard/repos/${event.repository.name}`
      });

    } catch (e: unknown) {
      console.error('[GitHub/Webhook] Roast execution failed:', e);
    }
}
