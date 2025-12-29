'use server';

import { google } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Use Admin client for background tasks where user session isn't available (webhooks)
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
  filename?: string; // Optional for PRs, we might roast multiple or the whole diff
  code: string;
}) {
  const { repo_id, user_id, pr_number, pr_title, code, filename } = params;

  // 1. Fetch User Persona
  const { data: settings } = await supabaseAdmin
    .from('user_settings')
    .select('persona')
    .eq('user_id', user_id)
    .single();

  const persona = settings?.persona || 'toxic';
  
  let personaInstruction = "";
  switch (persona) {
    case 'passive':
        personaInstruction = "You are a Passive Aggressive Senior Engineer. Don't be outwardly mean, but make backhanded compliments. Be subtle but stinging. If the code is good, begrudgingly admit it. ALWAYS provide a code snippet showing how you would have done it 'better'.";
        break;
    case 'shakespearean':
        personaInstruction = "You are William Shakespeare if he was a burned out developer. Roast the code using Old English, metaphors, and insults from his plays. Be dramatic. If the code is actually good, praise it like a sonnet. Regardless of quality, thee MUST provide a code example of the 'true path'.";
        break;
    case 'honest':
        personaInstruction = "You are a helpful, mentorship-focused Senior Engineer. Do NOT be toxic or mean. Instead, provide constructive, actionable feedback. Point out security flaws, performance issues, and bad practices kindly. Crucially, PROVIDE CODE EXAMPLES of how to refactor the code to be better. If the code is good, verify it and explain why.";
        break;
    case 'toxic':
    default:
        personaInstruction = "You are a Senior Software Engineer who is burnt out, cynical, and brutally honest. You hate bad code. Be mean, be funny, but be technically correct. Don't just insult; explain WHY it's garbage. HOWEVER, if the code is actually good/perfect, give it a high score (8-9) but NEVER give a 10/10. ALWAYS provide a refactored code snippet showing how to fix the mess.";
        break;
  }

  const systemPrompt = `
    ${personaInstruction} 
    
    Review the code in the PR titled '${pr_title}'.
    
    CRITICAL: You MUST start your response with exactly this format:
    Score: X/10
    Violations: X
    Critical Issues: X
    
    STRUCTURE YOUR FEEDBACK:
    1. Use a header "🚨 CRITICAL ISSUES" for severe problems.
    2. Use a header "⚠️ VIOLATIONS" for smaller issues.
    3. ALWAYS end with a "🛠️ PROPOSED REFACTOR" section containing a complete, improved code block.
  `;

  try {
    const { text } = await generateText({
      model: google('models/gemini-flash-latest'),
      system: systemPrompt,
      prompt: `Review this code:\n\n${code}`,
    });

    // Parse metrics
    const scoreMatch = text.match(/Score:\s*(\d+)\/10/i);
    const violationsMatch = text.match(/Violations:\s*(\d+)/i);
    const criticalMatch = text.match(/Critical Issues:\s*(\d+)/i);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    const violations = violationsMatch ? parseInt(violationsMatch[1]) : 0;
    const critical = criticalMatch ? parseInt(criticalMatch[1]) : 0;

    // 2. Save to DB
    await supabaseAdmin.from('roasts').insert({
      user_id,
      repo_id,
      pr_number,
      pr_title,
      roast_content: text,
      roast_score: score,
      violations_count: violations,
      critical_issues_count: critical,
    });

    return { text, score, violations, critical };
  } catch (error: unknown) {
    console.error("[RoastLogic] Failed:", error);
    throw error;
  }
}
