import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // Allow 60 seconds for generation

export async function POST(req: Request) {
  try {
    const { code, filename, repoId } = await req.json();
    console.log(`[API/Roast] Incoming request for file: ${filename}, repoId: ${repoId}`);
    
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

    // Fetch User Settings for Persona
    const { data: settings } = await supabase
        .from('user_settings')
        .select('persona')
        .eq('user_id', user.id)
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
            personaInstruction = "You are a Senior Software Engineer who is burnt out, cynical, and brutally honest. You hate bad code. Be mean, be funny, but be technically correct. Don't just insult; explain WHY it's garbage. HOWEVER, if the code is actually good/perfect, give it a high score (8-9) but NEVER give a 10/10—maintain your toxic pride by finding one tiny thing to nitpick. express shock that they didn't mess it up. ALWAYS provide a refactored code snippet showing how to fix the mess (or how to make it even cleaner).";
            break;
    }

    console.log(`[API/Roast] Starting Gemini stream using gemini-flash-latest with persona: ${persona}`);

        const result = streamText({
          model: google('models/gemini-flash-latest'),
          system: `${personaInstruction} Review the code in '${filename}'. 
          
          CRITICAL: You MUST start your response with exactly this format:
          Score: X/10
          Violations: X
          Critical Issues: X
          
          Then provide the rest of your review in Markdown.`,
          prompt: `Review this code:\n\n${code}`,
          onFinish: async ({ text }) => {
            console.log(`[API/Roast] Stream finished. Generated ${text.length} characters.`);
            
            if (text.length === 0) {
                console.error("[API/Roast] Error: Generated text is empty.");
                return; 
            }
    
            // Improved Regex for structured data
            const scoreMatch = text.match(/Score:\s*(\d+)\/10/i);
            const violationsMatch = text.match(/Violations:\s*(\d+)/i);
            const criticalMatch = text.match(/Critical Issues:\s*(\d+)/i);
    
            const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
            const violations = violationsMatch ? parseInt(violationsMatch[1]) : 0;
            const critical = criticalMatch ? parseInt(criticalMatch[1]) : 0;
    
            console.log(`[API/Roast] Parsed metrics - Score: ${score}, Violations: ${violations}, Critical: ${critical}`);
    
            const { error: dbError } = await supabase.from('roasts').insert({
              user_id: user.id,
              repo_id: repoId,
              pr_title: `Manual Roast: ${filename}`,
              roast_content: text,
              roast_score: score,
              violations_count: violations,
              critical_issues_count: critical,
            });
        if (dbError) {
            console.error("[API/Roast] Database Insert Error:", dbError);
        } else {
            console.log("[API/Roast] Roast saved successfully.");
        }
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