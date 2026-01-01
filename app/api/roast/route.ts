import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getPersona } from '@/lib/personas';

export const maxDuration = 60; // Allow 60 seconds for generation

export async function POST(req: Request) {
  try {
    const { code, filename, repoId } = await req.json();
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[API/Roast] Unauthorized: No user found");
      return new Response('Unauthorized', { status: 401 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("[API/Roast] Configuration Error: GOOGLE_GENERATIVE_AI_API_KEY is missing.");
      return new Response(JSON.stringify({ error: 'Google Generative AI API Key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch Repo Metadata for constructing links
    const { data: repo } = await supabase
        .from('repositories')
        .select('full_name, default_branch')
        .eq('id', repoId)
        .single();

    const repoFullName = repo?.full_name || 'unknown/repo';
    const branch = repo?.default_branch || 'main';
    const editUrl = `https://github.com/${repoFullName}/edit/${branch}/${filename}`;

    // Fetch User Settings for Persona
    const { data: settings } = await supabase
        .from('user_settings')
        .select('persona')
        .eq('user_id', user.id)
        .single();

    const persona = getPersona(settings?.persona);
    
    const BT = "```";
    const systemPrompt = `${persona.instruction.trim()}

Review the code in the file '${filename}'.

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
4. For EVERY issue mentioned, identify the line/logic and provide this exact link to fix it: [Fix on GitHub](${editUrl})
5. REFACTORING: ONLY provide a "${BT}🛠️ REFACTOR" snippet if essential.
6. BLOCKING: Set "should_block" to true only if there are security risks, logical bugs, or absolute garbage.
7. PERFECT CODE: If clean, provide a 1-sentence funny acknowledgement and set should_block to false.`;

    const result = streamText({
      model: google('models/gemini-flash-latest'),
      system: systemPrompt,
      prompt: `Review this code:\n\n${code}`,
      onFinish: async ({ text }) => {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        let score = null;
        let violations = 0;
        let critical = 0;

        if (jsonMatch) {
            try {
                const metrics = JSON.parse(jsonMatch[1]);
                score = metrics.score;
                violations = metrics.violations || 0;
                critical = metrics.critical_issues || 0;
            } catch (e) {
                console.error("[API/Roast] JSON Parse Failed", e);
            }
        }

        const cleanText = text.replace(/```json[\s\S]*?```/, "").trim();

        await supabase.from('roasts').insert({
          user_id: user.id,
          repo_id: repoId,
          pr_title: `Manual Roast: ${filename}`,
          roast_content: cleanText,
          roast_score: score,
          violations_count: violations,
          critical_issues_count: critical,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API/Roast] Critical Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
