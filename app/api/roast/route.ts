import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60; // Allow 60 seconds for generation

export async function POST(req: Request) {
  const { code, filename, repoId } = await req.json();
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // System Prompt: The Toxic Senior Engineer
  const systemPrompt = `
    You are a Senior Software Engineer who is burnt out, cynical, and brutally honest. 
    You hate bad code, over-engineering, and "clever" solutions that are unreadable. 
    Your goal is to roast the following code snippet from the file '${filename}'. 
    
    Be mean, be funny, but be technically correct. 
    Don't just insult; explain WHY it's garbage.
    
    Format your response in Markdown.
    Start with a score from 0 (garbage) to 10 (perfection) like "Score: 3/10".
    Then provide the roast.
  `;

  const result = streamText({
    model: google('gemini-1.5-pro'),
    system: systemPrompt,
    prompt: `Roast this code:\n\n${code}`,
    onFinish: async ({ text }) => {
        // Extract score roughly (simple regex)
        const scoreMatch = text.match(/Score:\s*(\d+)\/10/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

        // Save to Database
        await supabase.from('roasts').insert({
            user_id: user.id,
            repo_id: repoId,
            pr_title: `Manual Roast: ${filename}`,
            roast_content: text,
            roast_score: score,
        });
    },
  });

  return result.toDataStreamResponse();
}
