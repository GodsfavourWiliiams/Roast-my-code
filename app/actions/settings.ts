'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface UserSettings {
  user_id: string;
  persona: string;
  model: string;
  notifications: boolean;
  webhook_enabled: boolean;
}

export async function getUserSettings(): Promise<{ settings: UserSettings | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { settings: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error('Error fetching settings:', error);
    return { settings: null, error: error.message };
  }

  if (!data) {
    // Return default settings if no row exists
    return {
      settings: {
        user_id: user.id,
        persona: 'toxic',
        model: 'gemini-flash-latest',
        notifications: true,
        webhook_enabled: false
      },
      error: null
    };
  }

  return { settings: data, error: null };
}

export async function updateUserSettings(settings: Partial<UserSettings>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating settings:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function deleteUserAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Delete all user data via Supabase Admin (or user if RLS allows cascading)
  // Since we have foreign keys with 'on delete cascade', deleting the user *should* handle most things,
  // BUT auth.users deletion usually requires admin rights.
  // Instead, we will delete the data visible to us: repos, settings, roasts.
  
  // 1. Delete Repositories (Roasts cascade delete)
  const { error: repoError } = await supabase
    .from('repositories')
    .delete()
    .eq('user_id', user.id);

  if (repoError) {
    console.error('Error deleting repositories:', repoError);
    return { error: 'Failed to delete repositories' };
  }

  // 2. Delete Settings
  const { error: settingsError } = await supabase
    .from('user_settings')
    .delete()
    .eq('user_id', user.id);

  if (settingsError) {
    console.error('Error deleting settings:', settingsError);
    return { error: 'Failed to delete settings' };
  }

  // 3. Sign Out
  await supabase.auth.signOut();
  
  return { success: true };
}
