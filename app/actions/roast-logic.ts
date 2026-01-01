'use server';

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getPersona } from '@/lib/personas';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processAutomatedRoast(params: {
  repo_id: number;
  user_id: string;
  pr_number: number;
  pr_title: string;
  repo_full_name: string;
  code: string;
  was_truncated?: boolean;
  isLatestCommitOnly?: boolean;
}) {
  const { repo_id, user_id, pr_number, pr_title, code, was_truncated, isLatestCommitOnly } = params;

  const { data: settings } = await supabaseAdmin
    .from('user_settings')
    .select('persona')
    .eq('user_id', user_id)
    .single();

  const persona = getPersona(settings?.persona);

  const BT = "```";
  const reviewContext = isLatestCommitOnly 
    ? "You are reviewing ONLY the LATEST COMMIT that was pushed to this PR. The user tagged you to review their most recent changes after addressing your previous feedback."
    : "You are reviewing a Pull Request. Review ALL commits and changes in this PR (the complete diff from base to head).";
  
  const systemPrompt = `${persona.instruction.trim()}

${reviewContext}
${was_truncated ? "NOTE: This diff was very large and has been truncated. Analyze what is visible." : ""}

CRITICAL RULES - THINK LIKE A SENIOR DEVELOPER:
- Review ONLY the lines that were added/changed (marked with +) or removed (marked with -)
- DO NOT review unchanged code or files that weren't modified in this commit/PR
- Focus on what changed, not the entire codebase
- If a file wasn't touched, ignore it completely - don't mention it
- If the user addressed your previous feedback, acknowledge it but focus on NEW issues
- If there are no actual code changes (only whitespace/metadata), you should have detected this earlier
- Be contextually aware: if reviewing latest commit, the user likely fixed something you asked for

${isLatestCommitOnly ? "IMPORTANT: This is the LATEST COMMIT ONLY. The user pushed this after your last review. Focus on whether they properly addressed your feedback and if there are any NEW issues introduced." : ""}

CRITICAL: You MUST provide your metrics in a JSON block at the VERY END of your response.
The response should be Markdown feedback, followed by the JSON block.

JSON format:
${BT}json
{
  "score": number,
  "violations": number,
  "critical_issues": number,
  "should_block": boolean
}
${BT}

STRUCTURE YOUR FEEDBACK:
1. BE EXTREMELY CONCISE. Use maximum 2-3 bullet points. No fluff.
2. Use a header "🚨 CRITICAL" for severe problems.
3. Use a header "⚠️ VIOLATIONS" for smaller issues.
4. REFACTORING: ONLY provide a "${BT}🛠️ REFACTOR" snippet if essential.
5. BLOCKING RULES (CRITICAL):
   - Set "should_block" to true ONLY if there are:
     * Security vulnerabilities (SQL injection, XSS, exposed secrets, etc.)
     * Logical bugs that will break functionality or cause crashes
     * Absolute garbage code that cannot be merged
   - If issues are fixable but not critical (code quality, style, minor bugs, refactoring suggestions), set "should_block" to false.
   - When should_block is true: The PR merge button will be DISABLED. You MUST state: "This PR cannot be merged until these issues are fixed."
   - When should_block is false but issues exist: State: "You can merge, but I recommend fixing these issues first."
   - IMPORTANT: Only block if it's truly critical. Non-critical issues should allow merging.
6. PERFECT CODE: If clean, provide a 1-sentence funny acknowledgement and set should_block to false.

IMPORTANT: At the end of your feedback, if you requested changes or found issues, add this instruction:
"When you're done fixing these issues, reply with: done, ready, or review. If you have any questions about this feedback, just ask me."

If the code is perfect and you're approving, you don't need to add this instruction.`;

  try {
    const { text } = await generateText({
      model: google('models/gemini-flash-latest'),
      system: systemPrompt,
      prompt: isLatestCommitOnly 
        ? `Review ONLY the changes in the latest commit (user tagged you to check their fixes):\n\n${code}`
        : `Review ONLY the changes in this PR diff:\n\n${code}`,
    });

    // Reliable Parsing
    let score = null;
    let violations = 0;
    let critical = 0;
    let should_block = false;

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        try {
            const metrics = JSON.parse(jsonMatch[1]);
            score = metrics.score;
            violations = metrics.violations || 0;
            critical = metrics.critical_issues || 0;
            should_block = metrics.should_block || false;
        } catch (e) {
            console.error("[RoastLogic] JSON Parse Failed", e);
        }
    }

    // Clean up text by removing the JSON block for the UI
    const cleanText = text.replace(/```json[\s\S]*?```/, "").trim();

    await supabaseAdmin.from('roasts').insert({
      user_id,
      repo_id,
      pr_number,
      pr_title,
      roast_content: cleanText,
      roast_score: score,
      violations_count: violations,
      critical_issues_count: critical,
    });

    return { text: cleanText, score, violations, critical, should_block };
  } catch (error: unknown) {
    console.error("[RoastLogic] Failed:", error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function processReply(params: {
    user_id: string;
    repo_name: string;
    pr_number: number;
    user_comment: string;
    user_login: string;
}) {
    const { user_id, user_comment, user_login } = params;

    // Fetch Persona
    const { data: settings } = await supabaseAdmin
        .from('user_settings')
        .select('persona')
        .eq('user_id', user_id)
        .single();

    const persona = getPersona(settings?.persona);

    try {
        const { text } = await generateText({
            model: google('models/gemini-flash-latest'),
            system: `You are RoastBot, a sarcastic AI code reviewer. Persona: ${persona.instruction}

CRITICAL RULES:
- The user @${user_login} asked you a question or made a comment
- ANSWER THE QUESTION DIRECTLY - do NOT say you're "opening files" or "analyzing code"
- Do NOT trigger a code review - just answer their question
- If they ask why you reviewed something, explain your review process briefly
- If they ask about your behavior, explain it clearly
- Keep your sarcastic persona but be helpful and direct
- BE EXTREMELY CONCISE. Max 2-3 sentences. Answer immediately, don't delay.`,
            prompt: `User @${user_login} asked: "${user_comment}"

Answer their question directly. Do not say you're opening files or analyzing anything. Just answer the question.`,
        });

        return text.trim();
    } catch (e) {
        console.error("[ReplyLogic] Failed:", e);
        return "I'm too busy looking at your bad code to reply to this.";
    }
}
