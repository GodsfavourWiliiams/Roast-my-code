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
}) {
  const { repo_id, user_id, pr_number, pr_title, code, was_truncated } = params;

  const { data: settings } = await supabaseAdmin
    .from('user_settings')
    .select('persona')
    .eq('user_id', user_id)
    .single();

  const persona = getPersona(settings?.persona);

  const BT = "```";
  const systemPrompt = `
    ${persona.instruction} 
    
    Review the code in the PR titled '${pr_title}'.
    ${was_truncated ? "NOTE: This diff was very large and has been truncated. Analyze what is visible." : ""}
    
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
    5. BLOCKING: Set "should_block" to true only if there are security risks, logical bugs, or absolute garbage.
    6. PERFECT CODE: If clean, provide a 1-sentence funny acknowledgement and set should_block to false.`;

  try {
    const { text } = await generateText({
      model: google('models/gemini-flash-latest'),
      system: systemPrompt,
      prompt: `Review this code:\n\n${code}`,
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
            system: `You are a bot named RoastBot. Persona instructions: ${persona.instruction}. A user named @${user_login} commented on your roast: "${user_comment}". Reply to them. BE EXTREMELY CONCISE. Max 2 sentences. Keep the persona.`,
            prompt: `Reply to @${user_login}`,
        });

        return text.trim();
    } catch (e) {
        console.error("[ReplyLogic] Failed:", e);
        return "I'm too busy looking at your bad code to reply to this.";
    }
}
