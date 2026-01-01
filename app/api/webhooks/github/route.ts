import { getGitHubApp } from "@/lib/github-app";
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { processAutomatedRoast, processReply } from "@/app/actions/roast-logic";
import { getPersona } from "@/lib/personas";
import { App } from "octokit";

// Configure route for webhook handling
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const startTime = Date.now();
  let eventName: string | null = null;
  
  try {
    // Read raw body as text (required for signature verification)
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";
    eventName = req.headers.get("x-github-event");
    const deliveryId = req.headers.get("x-github-delivery") || "unknown";

    // Enhanced logging for production debugging
    console.log(`[GitHub/Webhook] Received event: ${eventName} (delivery: ${deliveryId})`);
    console.log(`[GitHub/Webhook] Payload size: ${payload.length} bytes`);
    console.log(`[GitHub/Webhook] Has signature: ${!!signature}`);
    console.log(`[GitHub/Webhook] Environment: ${process.env.NODE_ENV || 'unknown'}`);
    console.log(`[GitHub/Webhook] Webhook secret configured: ${!!process.env.GITHUB_WEBHOOK_SECRET}`);

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error(
        '[GitHub/Webhook] Error: SUPABASE_SERVICE_ROLE_KEY is missing.'
      );
      return NextResponse.json(
        { error: 'Server Configuration Error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Validate webhook secret is configured
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      console.error('[GitHub/Webhook] CRITICAL: GITHUB_WEBHOOK_SECRET is not set in production environment');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const app = getGitHubApp();
    
    // Verify signature
    try {
      await app.webhooks.verify(payload, signature);
      console.log(`[GitHub/Webhook] Signature verified successfully`);
    } catch (verifyError) {
      console.error(`[GitHub/Webhook] Signature verification failed:`, verifyError);
      console.error(`[GitHub/Webhook] Signature header: ${signature.substring(0, 20)}...`);
      console.error(`[GitHub/Webhook] Webhook secret length: ${process.env.GITHUB_WEBHOOK_SECRET?.length || 0}`);
      console.error(`[GitHub/Webhook] Payload preview: ${payload.substring(0, 100)}...`);
      
      // Return 401 for signature failures (GitHub will retry)
      return NextResponse.json(
        { error: "Invalid signature - check GITHUB_WEBHOOK_SECRET matches GitHub App settings" },
        { status: 401 }
      );
    }
    
    const event = JSON.parse(payload) as GitHubWebhookPayload;
    console.log(`[GitHub/Webhook] Parsed event, action: ${event.action || 'N/A'}`);

    // Route to specialized handlers
    let response;
    try {
      switch (eventName) {
        case 'issue_comment':
          response = await handleIssueComment(app, supabaseAdmin, event);
          break;
        case 'pull_request':
          console.log(
            `[GitHub/Webhook] Handling pull_request event with action: ${event.action}`
          );
          response = await handlePullRequest(app, supabaseAdmin, event);
          break;
        case 'installation':
          response = await handleInstallation(supabaseAdmin, event);
          break;
        case 'repository':
          response = await handleRepositoryUpdate(supabaseAdmin, event);
          break;
        default:
          console.log(`[GitHub/Webhook] Ignoring event type: ${eventName}`);
          response = NextResponse.json({ message: 'Ignored event' });
      }
    } catch (handlerError) {
      console.error(`[GitHub/Webhook] Handler error for ${eventName}:`, handlerError);
      throw handlerError; // Re-throw to be caught by outer catch
    }
    
    const duration = Date.now() - startTime;
    console.log(`[GitHub/Webhook] Event ${eventName} processed in ${duration}ms`);
    return response;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[GitHub/Webhook] Error processing ${eventName || 'unknown'} event (${duration}ms):`, error);
    
    if (error instanceof Error) {
      console.error('[GitHub/Webhook] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    // Return appropriate status based on error type
    if (error instanceof Error && error.message.includes('signature')) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
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
    
    // Simple logic: If comment contains a review keyword, it's a review request
    // Everything else is treated as a question/comment to be answered
    const reviewKeywords = ['ready', 'fixed', 'done', 'roast', 'review', 'check', 'look'];
    // Check if any review keyword appears as a whole word (not part of another word)
    const hasReviewKeyword = reviewKeywords.some(keyword => {
      // Match whole word - either at start/end of string or surrounded by non-word chars
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(commentBody);
    });
    
    // Review request = has review keyword (simple as that)
    const isReviewRequest = hasReviewKeyword;

    // Log decision for debugging
    console.log(`[GitHub/Webhook] Comment analysis:`, {
      comment: commentBody.substring(0, 100),
      hasReviewKeyword,
      isReviewRequest: hasReviewKeyword ? 'REVIEW' : 'QUESTION/COMMENT',
    });

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
async function handlePullRequest(
  app: App,
  supabase: SupabaseClient,
  event: GitHubWebhookPayload
) {
  const { action, repository, pull_request } = event;
  if (!repository || !pull_request) {
    console.log(
      '[GitHub/Webhook] handlePullRequest: Missing repository or pull_request in event'
    );
    return NextResponse.json({ success: true });
  }

  const prNumber = pull_request.number;
  console.log(
    `[GitHub/Webhook] handlePullRequest: Processing PR #${prNumber} in ${repository.name} (action: ${action})`
  );

  // Fetch all instances of this repository in our database (multiple users might have imported it)
  const { data: repos, error: reposError } = await supabase
    .from('repositories')
    .select('id, user_id, status, open_prs_count, full_name')
    .eq('github_id', repository.id);

  if (reposError) {
    console.error(
      '[GitHub/Webhook] handlePullRequest: Error fetching repos:',
      reposError
    );
    return NextResponse.json({ message: 'Error fetching repos' });
  }

  if (!repos || repos.length === 0) {
    console.log(
      `[GitHub/Webhook] handlePullRequest: Repo ${repository.name} (${repository.id}) not monitored`
    );
    return NextResponse.json({ message: 'Repo not monitored' });
  }

  // To respect the "only owner can roast" rule, we should only process the entry 
  // where the current repo owner matches the user_id's GitHub identity.
  // However, we only need to trigger ONE roast per PR event.
  // We'll look for the first 'Running' instance.
  const activeRepo = repos.find(r => r.status === 'Running');

  if (activeRepo) {
    console.log(
      `[GitHub/Webhook] handlePullRequest: Found active repo entry for user ${activeRepo.user_id}`
    );
  }

  // 1. Sync metadata for ALL instances of this repo in our DB
  if (['opened', 'closed', 'reopened', 'synchronize'].includes(action)) {
    try {
      const octokit = await app.getInstallationOctokit(event.installation!.id);
      const [{ data: repoData }, { data: openPulls }] = await Promise.all([
        octokit.request('GET /repos/{owner}/{repo}', {
          owner: repository.owner.login,
          repo: repository.name,
        }),
        octokit.request('GET /repos/{owner}/{repo}/pulls', {
          owner: repository.owner.login,
          repo: repository.name,
          state: 'open',
          per_page: 100,
        }),
      ]);

      // Update all records for this github_id
      await supabase
        .from('repositories')
        .update({
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description,
          language: repoData.language,
          url: repoData.html_url,
          open_prs_count: openPulls.length,
          updated_at: new Date().toISOString(),
        })
        .eq('github_id', repository.id);
    } catch (e) {
      console.error('Sync failed', e);
    }
  }

  // 2. Trigger Roast only if an active instance was found
  if (['opened', 'reopened'].includes(action)) {
    if (activeRepo) {
      console.log(
        `[GitHub/Webhook] Triggering roast for PR #${prNumber} in ${repository.name} (action: ${action})`
      );
      await triggerAutomatedRoast(app, supabase, event, activeRepo, prNumber, false);
    } else {
      console.log(
        `[GitHub/Webhook] Skipping roast for PR #${prNumber} - no active (Running) status found among ${repos.length} records.`
      );
    }
  }

  if (action === 'closed') {
    console.log(
      `[GitHub/Webhook] PR #${prNumber} in ${repository.name} was closed`
    );
    // Add notifications for all users who track this repo
    for (const r of repos) {
        try {
            await supabase.from('notifications').insert({
                user_id: r.user_id,
                title: 'PR Closed',
                message: `PR #${prNumber} in ${repository.name} has been closed.`,
                type: 'info',
                link: `/dashboard/repos/${repository.name}`,
            });
        } catch (e) {
            console.error(`[GitHub/Webhook] Failed to notify user ${r.user_id}:`, e);
        }
    }
  }
  return NextResponse.json({ success: true });
}

/**
 * Handle App installations
 */
async function handleInstallation(
  supabase: SupabaseClient,
  event: GitHubWebhookPayload
) {
  const { action, sender, installation } = event;
  const githubId = sender.id;

  if (action === 'created') {
    await supabase
      .from('user_settings')
      .update({ installation_id: installation!.id })
      .eq('github_id', githubId);
  } else if (action === 'deleted') {
    await supabase
      .from('user_settings')
      .update({ installation_id: null, suspended: false })
      .eq('github_id', githubId);
  } else if (action === 'suspend') {
    await supabase
      .from('user_settings')
      .update({ suspended: true })
      .eq('github_id', githubId);
  } else if (action === 'unsuspend') {
    await supabase
      .from('user_settings')
      .update({ suspended: false })
      .eq('github_id', githubId);
  }
  return NextResponse.json({ success: true });
}

/**
 * Handle repo rename/delete on GitHub
 */
async function handleRepositoryUpdate(
  supabase: SupabaseClient,
  event: GitHubWebhookPayload
) {
  const { action, repository } = event;
  if (!repository) return NextResponse.json({ success: true });

  if (action === 'renamed' || action === 'edited') {
    await supabase
      .from('repositories')
      .update({
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        url: repository.html_url,
        updated_at: new Date().toISOString(),
      })
      .eq('github_id', repository.id);
  }

  if (action === 'deleted') {
    const { data: repo } = await supabase
      .from('repositories')
      .select('user_id, name')
      .eq('github_id', repository.id)
      .single();
    if (repo) {
      await supabase.from('notifications').insert({
        user_id: repo.user_id,
        title: 'Repository Deleted on GitHub',
        message: `The repository ${repo.name} was deleted on GitHub. Analysis has been stopped.`,
        type: 'error',
      });
      await supabase
        .from('repositories')
        .update({ status: 'Deleted', updated_at: new Date().toISOString() })
        .eq('github_id', repository.id);
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
  if (!event.repository) {
    console.error(
      '[GitHub/Webhook] triggerAutomatedRoast: No repository in event'
    );
    return;
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('user_settings')
    .select('installation_id')
    .eq('user_id', repo.user_id)
    .single();

  if (settingsError) {
    console.error(
      '[GitHub/Webhook] triggerAutomatedRoast: Failed to fetch settings:',
      settingsError
    );
    return;
  }

  if (!settings?.installation_id) {
    console.error(
      '[GitHub/Webhook] triggerAutomatedRoast: No installation_id found for user:',
      repo.user_id
    );
    return;
  }

  try {
    const octokit = await app.getInstallationOctokit(settings.installation_id);

    let diff: string;
    let was_truncated = false;

    if (reviewLatestCommitOnly) {
      // Get the latest commit from the PR
      const { data: prData } = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
        }
      );

      // Get commits for this PR
      const { data: commits } = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}/commits',
        {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          per_page: 1, // Get only the latest commit
        }
      );

      if (!commits || commits.length === 0) {
        // No commits, respond that there are no changes
        await octokit.request(
          'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
          {
            owner: event.repository.owner.login,
            repo: event.repository.name,
            issue_number: prNumber,
            body: `## 💀 RoastBot Autopsy Report\n\n**No changes detected.**\n\nYou asked me to review, but there are no new commits since the last review. If you've made changes, make sure you've pushed them to this PR.\n\n---\n*Sent with attitude by RoastBot*`,
          }
        );
        return;
      }

      const latestCommit = commits[0];
      // Get the diff for just this commit
      const { data: commitData } = await octokit.request(
        'GET /repos/{owner}/{repo}/commits/{ref}',
        {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          ref: latestCommit.sha,
          headers: { accept: 'application/vnd.github.v3.diff' },
        }
      );

      diff = commitData as unknown as string;

      // Check if diff has actual changes (not just metadata)
      // Look for lines that start with + or - but not +++ or --- (which are file headers)
      const diffLines = diff ? diff.split('\n') : [];
      const hasActualChanges = diffLines.some((line) => {
        const trimmed = line.trim();
        return (
          (trimmed.startsWith('+') && !trimmed.startsWith('+++')) ||
          (trimmed.startsWith('-') && !trimmed.startsWith('---'))
        );
      });

      if (!hasActualChanges || !diff || diff.trim().length === 0) {
        // No actual code changes detected
        await octokit.request(
          'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
          {
            owner: event.repository.owner.login,
            repo: event.repository.name,
            issue_number: prNumber,
            body: `## 💀 RoastBot Autopsy Report\n\n**No code changes detected in the latest commit.**\n\nI checked commit \`${latestCommit.sha.substring(
              0,
              7
            )}\` and found no actual code modifications. If you requested changes based on my previous review, make sure you've actually modified the code, not just committed empty changes or metadata.\n\n---\n*Sent with attitude by RoastBot*`,
          }
        );
        return;
      }
    } else {
      // Get full PR diff (for automatic reviews on PR open)
      const { data: rawDiff } = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
          owner: event.repository.owner.login,
          repo: event.repository.name,
          pull_number: prNumber,
          headers: { accept: 'application/vnd.github.v3.diff' },
        }
      );
      diff = rawDiff as unknown as string;
    }

    const MAX_DIFF_SIZE = 100000;
    const processedCode =
      diff.length > MAX_DIFF_SIZE ? diff.substring(0, MAX_DIFF_SIZE) : diff;
    was_truncated = diff.length > MAX_DIFF_SIZE;

    const roast = await processAutomatedRoast({
      repo_id: repo.id,
      user_id: repo.user_id,
      pr_number: prNumber,
      pr_title: event.pull_request?.title || event.issue?.title || 'PR',
      repo_full_name: event.repository.full_name,
      code: processedCode,
      was_truncated,
      isLatestCommitOnly: reviewLatestCommitOnly,
    });

    // Determine review event and add blocking message if needed
    const reviewEvent = roast.should_block ? 'REQUEST_CHANGES' : 'APPROVE';
    let reviewBody = `## 💀 RoastBot Autopsy Report\n\n${roast.text}`;

    // Get PR data to check branch protection and get commit SHA
    const prData = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}',
      {
        owner: event.repository.owner.login,
        repo: event.repository.name,
        pull_number: prNumber,
      }
    );

    // Check if branch protection is enabled (only if we're blocking)
    let branchProtectionEnabled = false;
    if (roast.should_block) {
      try {
        const baseBranch = prData.data.base.ref;
        await octokit.request(
          'GET /repos/{owner}/{repo}/branches/{branch}/protection',
          {
            owner: event.repository.owner.login,
            repo: event.repository.name,
            branch: baseBranch,
          }
        );
        branchProtectionEnabled = true;
      } catch {
        // 404 means branch protection is not enabled
        branchProtectionEnabled = false;
      }
    }

    if (roast.should_block) {
      reviewBody += `\n\n**🛑 BLOCKING: This PR contains critical issues and should NOT be merged until they are fixed.**`;

      // Warn if branch protection is off
      if (!branchProtectionEnabled) {
        reviewBody += `\n\n⚠️ **Note:** Branch protection is not enabled for this repository. To allow RoastBot to automatically block merges when critical issues are found, enable branch protection rules that require reviews. Go to Settings → Branches → Add rule for your default branch and enable "Require pull request reviews before merging".`;
      }
    } else if (roast.violations > 0 || roast.critical > 0) {
      reviewBody += `\n\n**⚠️ You can merge, but I recommend fixing these issues first.**`;
    }

    reviewBody += `\n\n---\n*Sent with attitude by RoastBot*`;

    // Submit the review - REQUEST_CHANGES will block merge if branch protection requires reviews
    const reviewResponse = await octokit.request(
      'POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
      {
        owner: event.repository.owner.login,
        repo: event.repository.name,
        pull_number: prNumber,
        body: reviewBody,
        event: reviewEvent,
        commit_id: prData.data.head.sha, // Associate review with the latest commit
      }
    );

    // If we're requesting changes, dismiss any existing approvals to ensure the PR is blocked
    if (roast.should_block && reviewResponse.data.id) {
      try {
        // Get existing reviews
        const { data: reviews } = await octokit.request(
          'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
          {
            owner: event.repository.owner.login,
            repo: event.repository.name,
            pull_number: prNumber,
          }
        );

        // Dismiss any existing APPROVE reviews to ensure REQUEST_CHANGES blocks the merge
        // This ensures that our REQUEST_CHANGES review takes precedence
        for (const review of reviews) {
          if (
            review.state === 'APPROVED' &&
            review.id !== reviewResponse.data.id
          ) {
            try {
              await octokit.request(
                'PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals',
                {
                  owner: event.repository.owner.login,
                  repo: event.repository.name,
                  pull_number: prNumber,
                  review_id: review.id,
                  message:
                    'Dismissed due to new critical issues found that must be fixed before merging.',
                }
              );
            } catch (e) {
              // Log detailed error for critical review dismissal operation
              // This is sensitive permission-dependent behavior - we need visibility
              const errorDetails = e instanceof Error 
                ? { message: e.message, name: e.name, stack: e.stack }
                : { error: String(e) };
              
              console.error(
                `[GitHub/Webhook] Failed to dismiss review (ID: ${review.id}) for PR #${prNumber}.`,
                {
                  reviewId: review.id,
                  prNumber,
                  repo: event.repository.name,
                  error: errorDetails,
                  note: 'This may indicate permission issues or API rate limits. Review dismissal is critical for blocking merges.'
                }
              );
            }
          }
        }
      } catch (e) {
        // If we can't dismiss reviews, continue - REQUEST_CHANGES should still block
        console.error(
          '[GitHub/Webhook] Failed to dismiss existing approvals:',
          e
        );
      }
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: repo.user_id,
      title: roast.should_block ? '🛑 PR Merge Blocked' : '✅ Roast Completed',
      message: roast.should_block
        ? `PR #${prNumber} in ${event.repository.name} has critical issues and cannot be merged.`
        : `PR #${prNumber} in ${event.repository.name} has been reviewed. Score: ${roast.score}/10`,
      type: roast.should_block ? 'error' : 'success',
      link: `/dashboard/repos/${event.repository.name}`,
    });
  } catch (e: unknown) {
    console.error('[GitHub/Webhook] Roast execution failed:', e);
    // Log more details for debugging
    if (e instanceof Error) {
      console.error('[GitHub/Webhook] Error details:', {
        message: e.message,
        stack: e.stack,
        prNumber,
        repoId: repo.id,
        userId: repo.user_id,
      });
    }
  }
}