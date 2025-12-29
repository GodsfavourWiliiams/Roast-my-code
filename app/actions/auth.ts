'use server';

import { createClient } from '@/lib/supabase/server';

export async function syncUserIdentity() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) return;

  // GitHub ID is usually in user_metadata or identities
  const githubIdentity = session.user.identities?.find(id => id.provider === 'github');
  
  if (githubIdentity?.id) {
    const githubId = parseInt(githubIdentity.id);
    
    // Upsert user settings with github_id
    await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        github_id: githubId,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  }
}
