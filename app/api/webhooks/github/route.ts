import { getGitHubApp } from "@/lib/github-app";
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { processAutomatedRoast, processReply } from "@/app/actions/roast-logic";
import { getPersona } from "@/lib/personas";
import { App } from "octokit";

interface GitHubWebhookPayload {
  action: string;
  sender: {
    id: number;
    login: string;
  };
  installation?: {
    id: number;
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
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

    // Route to specialized handlers
    switch (eventName) {
        case "issue_comment":
            return handleIssueComment(app, supabaseAdmin, event);
        case "pull_request":
            return handlePullRequest(app, supabaseAdmin, event);
        case "installation":
            return handleInstallation(supabaseAdmin, event);
        case "repository":
            return handleRepositoryUpdate(supabaseAdmin, event);
        default:
            return NextResponse.json({ message: "Ignored event" });
    }
  } catch (error: unknown) {
    console.error("[GitHub/Webhook] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid request" }, { status: 401 });
  }
}

/**
 * Handle user comments/mentions
 */
async function handleIssueComment(app: App, supabase: SupabaseClient, event: GitHubWebhookPayload) {
    if (event.action !== "created" || !event.issue?.pull_request || !event.comment) {
        return NextResponse.json({ success: true });
    }

    const commentBody = event.comment.body.toLowerCase();
    const isMentioned = commentBody.includes('roastbot');
    const userLogin = event.comment.user.login;
    const isNotBot = !userLogin.includes('[bot]');

    if (!isMentioned || !isNotBot) return NextResponse.json({ success: true });

    const { data: repo } = await supabase
        .from('repositories')
        .select('id, user_id, full_name, name, status')
        .eq('github_id', event.repository!.id)
        .single();

    if (!repo) return NextResponse.json({ message: "Repo not found" });

    // Fetch user persona once
    const { data: settings } = await supabase
        .from('user_settings')
        .select('persona, installation_id')
        .eq('user_id', repo.user_id)
        .single();

    const persona = getPersona(settings?.persona);
    const prNumber = event.issue.number;
    
    // Check if it's a question first (questions should be answered, not reviewed)
    const questionWords = ['how', 'why', 'what', 'when', 'where', 'which', 'who', 'can you', 'could you', 'should', 'is', 'are', 'do', 'does', 'did', 'will', 'would', 'explain', 'tell me', 'help'];
    const hasQuestionWord = questionWords.some(word => commentBody.toLowerCase().includes(word));
    const hasQuestionMark = commentBody.includes('?');
    const isQuestion = hasQuestionWord || hasQuestionMark || commentBody.trim().length > 50;
    
    // Simple keywords that trigger review (only if NOT a question)
    const reviewKeywords = ['ready', 'fixed', 'done', 'roast', 'review', 'check', 'look'];
    const hasReviewKeyword = reviewKeywords.some(keyword => commentBody.includes(keyword));
    
    // Review request = has keyword AND is short AND is NOT a question
    const isShortMessage = commentBody.trim().length <= 50;
    const isReviewRequest = !isQuestion && isShortMessage && hasReviewKeyword;

    if (isReviewRequest) {
        const octokit = await app.getInstallationOctokit(event.installation!.id);
        
        // Parallel acknowledgement post + notif insert
        await Promise.all([
            octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                owner: event.repository!.owner.login,
                repo: event.repository!.name,
                issue_number: prNumber,
                body: persona.acknowledgement,
            }),
            supabase.from('notifications').insert({
                user_id: repo.user_id,
                title: 'Analysis Started',
                message: `RoastBot is currently dissecting PR #${prNumber} in ${event.repository!.name}.`,
                type: 'info',
                link: `/dashboard/repos/${event.repository!.name}`
            })
        ]);

        // When user tags @roastbot for review, review only the latest commit
        await triggerAutomatedRoast(app, supabase, event, repo, prNumber, true);
    } else {
        // It's a question or general comment - let AI respond conversationally
        const reply = await processReply({
            user_id: repo.user_id,
            repo_name: repo.full_name,
            pr_number: prNumber,
            user_comment: event.comment.body,
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

    return NextResponse.json({ success: true });
}

/**
 * Handle new PRs and commit updates
 */
async function handlePullRequest(app: App, supabase: SupabaseClient, event: GitHubWebhookPayload) {
    const { action, repository, pull_request } = event;
    if (!repository || !pull_request) return NextResponse.json({ success: true });

    const prNumber = pull_request.number;
    const { data: repo } = await supabase
        .from('repositories')
        .select('id, user_id, status, open_prs_count')
        .eq('github_id', repository.id)
        .single();

    if (!repo) return NextResponse.json({ message: "Repo not monitored" });

    // Sync metadata
    if (["opened", "closed", "reopened", "synchronize"].includes(action)) {
        try {
            const octokit = await app.getInstallationOctokit(event.installation!.id);
            const [{ data: repoData }, { data: openPulls }] = await Promise.all([
                octokit.request('GET /repos/{owner}/{repo}', { owner: repository.owner.login, repo: repository.name }),
                octokit.request('GET /repos/{owner}/{repo}/pulls', { owner: repository.owner.login, repo: repository.name, state: 'open', per_page: 100 })
            ]);
            
            await supabase.from('repositories').update({ 
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

    if (["opened", "reopened"].includes(action)) {
        if (repo.status === 'Running') {
            // For PR opens, review ALL commits in the PR (full diff)
            await triggerAutomatedRoast(app, supabase, event, repo, prNumber, false);
        } else {
            await supabase.from('notifications').insert({
                user_id: repo.user_id,
                title: 'Roast Skipped',
                message: `PR #${prNumber} was ${action}, but the bot is ${repo.status}.`,
                type: 'warning',
                link: `/dashboard/repos/${repository.name}`,
            });
        }
    }

    return NextResponse.json({ success: true });
}

/**
 * Handle App installations
 */
async function handleInstallation(supabase: SupabaseClient, event: GitHubWebhookPayload) {
    const { action, sender, installation } = event;
    const githubId = sender.id;

    if (action === "created") {
        await supabase.from('user_settings').update({ installation_id: installation!.id }).eq('github_id', githubId);
    } else if (action === "deleted") {
        await supabase.from('user_settings').update({ installation_id: null, suspended: false }).eq('github_id', githubId);
    } else if (action === "suspend") {
        await supabase.from('user_settings').update({ suspended: true }).eq('github_id', githubId);
    } else if (action === "unsuspend") {
        await supabase.from('user_settings').update({ suspended: false }).eq('github_id', githubId);
    }
    return NextResponse.json({ success: true });
}

/**
 * Handle repo rename/delete on GitHub
 */
async function handleRepositoryUpdate(supabase: SupabaseClient, event: GitHubWebhookPayload) {
    const { action, repository } = event;
    if (!repository) return NextResponse.json({ success: true });

    if (action === "renamed" || action === "edited") {
        await supabase.from('repositories').update({
            name: repository.name,
            full_name: repository.full_name,
            description: repository.description,
            url: repository.html_url,
            updated_at: new Date().toISOString()
        }).eq('github_id', repository.id);
    }

    if (action === "deleted") {
        const { data: repo } = await supabase.from('repositories').select('user_id, name').eq('github_id', repository.id).single();
        if (repo) {
            await supabase.from('notifications').insert({
                user_id: repo.user_id,
                title: 'Repository Deleted on GitHub',
                message: `The repository ${repo.name} was deleted on GitHub. Analysis has been stopped.`,
                type: 'error'
            });
            await supabase.from('repositories').update({ status: 'Deleted', updated_at: new Date().toISOString() }).eq('github_id', repository.id);
        }
    }
    return NextResponse.json({ success: true });
}

async function triggerAutomatedRoast(
    app: App, 
    supabaseAdmin: SupabaseClient, 
    event: GitHubWebhookPayload, 
    repo: { id: number; user_id: string; status: string }, 
    prNumber: number,
    reviewLatestCommitOnly: boolean = false
) {
    if (!event.repository) return;      
    const { data: settings } = await supabaseAdmin.from('user_settings').select('installation_id').eq('user_id', repo.user_id).single();
    if (!settings?.installation_id) return;

    try {
      const octokit = await app.getInstallationOctokit(settings.installation_id);
      
      let diff: string;
      let was_truncated = false;
      
      if (reviewLatestCommitOnly) {
        // Get the latest commit from the PR
        const { data: prData } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
        });
        
        // Get commits for this PR
        const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/commits', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          per_page: 1, // Get only the latest commit
        });
        
        if (!commits || commits.length === 0) {
          // No commits, respond that there are no changes
          await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner: event.repository.owner.login,
            repo: event.repository.name,
            issue_number: prNumber,
            body: `## 💀 RoastBot Autopsy Report\n\n**No changes detected.**\n\nYou asked me to review, but there are no new commits since the last review. If you've made changes, make sure you've pushed them to this PR.\n\n---\n*Sent with attitude by RoastBot*`,
          });
          return;
        }
        
        const latestCommit = commits[0];
        // Get the diff for just this commit
        const { data: commitData } = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          ref: latestCommit.sha,
          headers: { accept: 'application/vnd.github.v3.diff' },
        });
        
        diff = commitData as unknown as string;
        
        // Check if diff has actual changes (not just metadata)
        // Look for lines that start with + or - but not +++ or --- (which are file headers)
        const diffLines = diff ? diff.split('\n') : [];
        const hasActualChanges = diffLines.some(line => {
          const trimmed = line.trim();
          return (trimmed.startsWith('+') && !trimmed.startsWith('+++')) || 
                 (trimmed.startsWith('-') && !trimmed.startsWith('---'));
        });
        
        if (!hasActualChanges || !diff || diff.trim().length === 0) {
          // No actual code changes detected
          await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner: event.repository.owner.login,
            repo: event.repository.name,
            issue_number: prNumber,
            body: `## 💀 RoastBot Autopsy Report\n\n**No code changes detected in the latest commit.**\n\nI checked commit \`${latestCommit.sha.substring(0, 7)}\` and found no actual code modifications. If you requested changes based on my previous review, make sure you've actually modified the code, not just committed empty changes or metadata.\n\n---\n*Sent with attitude by RoastBot*`,
          });
          return;
        }
      } else {
        // Get full PR diff (for automatic reviews on PR open)
        const { data: rawDiff } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          headers: { accept: 'application/vnd.github.v3.diff' },
        });
        diff = rawDiff as unknown as string;
      }

      const MAX_DIFF_SIZE = 100000;
      const processedCode = diff.length > MAX_DIFF_SIZE ? diff.substring(0, MAX_DIFF_SIZE) : diff;
      was_truncated = diff.length > MAX_DIFF_SIZE;

      const roast = await processAutomatedRoast({
          repo_id: repo.id,
          user_id: repo.user_id,
          pr_number: prNumber,
          pr_title: event.pull_request?.title || event.issue?.title || "PR",
          repo_full_name: event.repository.full_name,
          code: processedCode,
          was_truncated,
          isLatestCommitOnly: reviewLatestCommitOnly,
      });

      // Determine review event and add blocking message if needed
      const reviewEvent = roast.should_block ? 'REQUEST_CHANGES' : 'APPROVE';
      let reviewBody = `## 💀 RoastBot Autopsy Report\n\n${roast.text}`;
      
      if (roast.should_block) {
        reviewBody += `\n\n**🛑 BLOCKING: This PR cannot be merged until the critical issues above are fixed.**\n\nYou must address these issues before merging. The merge button will be disabled until you fix them and I approve the changes.`;
      } else if (roast.violations > 0 || roast.critical > 0) {
        reviewBody += `\n\n**⚠️ You can merge, but I recommend fixing these issues first.**`;
      }
      
      reviewBody += `\n\n---\n*Sent with attitude by RoastBot*`;
      
      // Submit the review - REQUEST_CHANGES will block merge if branch protection requires reviews
      // Include commit_id to ensure the review is properly associated with the latest commit
      const prData = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner: event.repository.owner.login,
        repo: event.repository.name,
        pull_number: prNumber,
      });
      
      const reviewResponse = await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          body: reviewBody,
          event: reviewEvent,
          commit_id: prData.data.head.sha // Associate review with the latest commit
      });
      
      // If we're requesting changes, dismiss any existing approvals to ensure the PR is blocked
      if (roast.should_block && reviewResponse.data.id) {
        try {
          // Get existing reviews
          const { data: reviews } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
            owner: event.repository.owner.login,
            repo: event.repository.name,
            pull_number: prNumber,
          });
          
          // Dismiss any existing APPROVE reviews to ensure REQUEST_CHANGES blocks the merge
          // This ensures that our REQUEST_CHANGES review takes precedence
          for (const review of reviews) {
            if (review.state === 'APPROVED' && review.id !== reviewResponse.data.id) {
              try {
                await octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals', {
                  owner: event.repository.owner.login,
                  repo: event.repository.name,
                  pull_number: prNumber,
                  review_id: review.id,
                  message: 'Dismissed due to new critical issues found that must be fixed before merging.'
                });
              } catch (e) {
                // Ignore errors - review might not be dismissable or we might not have permission
                // REQUEST_CHANGES should still block if branch protection requires reviews
              }
            }
          }
        } catch (e) {
          // If we can't dismiss reviews, continue - REQUEST_CHANGES should still block
          console.error('[GitHub/Webhook] Failed to dismiss existing approvals:', e);
        }
      }

      await supabaseAdmin.from('notifications').insert({
          user_id: repo.user_id,
          title: roast.should_block ? '🛑 PR Merge Blocked' : '✅ Roast Completed',
          message: roast.should_block 
              ? `PR #${prNumber} in ${event.repository.name} has critical issues and cannot be merged.` 
              : `PR #${prNumber} in ${event.repository.name} has been reviewed. Score: ${roast.score}/10`,
          type: roast.should_block ? 'error' : 'success',
          link: `/dashboard/repos/${event.repository.name}`
      });

    } catch (e: unknown) {
      console.error('[GitHub/Webhook] Roast execution failed:', e);
    }
}