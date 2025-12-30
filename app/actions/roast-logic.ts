'use server';

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

  const persona = settings?.persona || 'toxic';
  
  let personaInstruction = "";
  switch (persona) {
    case 'passive':
        personaInstruction = "You are a Passive Aggressive Senior Engineer. Be subtle but stinging. Always provide code suggestions. If the code is good, begrudgingly admit it.";
        break;
    case 'shakespearean':
        personaInstruction = "You are William Shakespeare if he was a burned out developer. Roast using Old English and play metaphors. Always provide code examples.";
        break;
    case 'honest':
        personaInstruction = "You are a helpful, mentorship-focused Senior Engineer. Provide constructive feedback and refactoring examples kindly.";
        break;
    case 'toxic':
    default:
        personaInstruction = "You are a Senior Software Engineer who is burnt out, cynical, and brutally honest. You hate bad code. Be mean, funny, but technically correct. Max score is 9/10.";
        break;
  }

  const BT = "```";
  const systemPrompt = `${personaInstruction} 
    
    Review the code in the PR titled '${pr_title}'.
    ${was_truncated ? "NOTE: This diff was very large and has been truncated. Analyze what is visible." : ""}
    
    CRITICAL: You MUST provide your metrics in a JSON block at the VERY END of your response.
    The response should be Markdown feedback, followed by the JSON block.
    
    JSON format:
    ${BT}json
    {
      "score": number,
      "violations": number,
      "critical_issues": number
    }
    ${BT}
    
    STRUCTURE YOUR FEEDBACK:
    1. Use a header "🚨 CRITICAL ISSUES" for severe problems.
    2. Use a header "⚠️ VIOLATIONS" for smaller issues.
    3. ALWAYS end the text section with a "🛠️ PROPOSED REFACTOR" section.`;

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

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        try {
            const metrics = JSON.parse(jsonMatch[1]);
            score = metrics.score;
            violations = metrics.violations || 0;
            critical = metrics.critical_issues || 0;
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

    return { text: cleanText, score, violations, critical };
  } catch (error: unknown) {
    console.error("[RoastLogic] Failed:", error instanceof Error ? error.message : error);
    throw error;
  }
}
