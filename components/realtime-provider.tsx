"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    console.log('[Realtime] Starting aggressive global subscription...');

    // Function to trigger immediate re-fetch
    const forceRefresh = () => {
      // refetchQueries forces an immediate network call regardless of state
      queryClient.refetchQueries({ queryKey: ['savedRepos'], type: 'active' });
      queryClient.refetchQueries({
        queryKey: ['dashboardStats'],
        type: 'active',
      });
      queryClient.refetchQueries({ queryKey: ['repoDetails'], type: 'active' });
    };

    const channel = supabase
      .channel('global-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repositories' },
        () => {
          console.log(
            '[Realtime] Repository change detected. Forcing refresh...'
          );
          forceRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roasts' },
        () => {
          console.log('[Realtime] Roast change detected. Forcing refresh...');
          forceRefresh();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return <>{children}</>;
}