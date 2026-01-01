"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Function to trigger immediate re-fetch
    const forceRefresh = () => {
      // refetchQueries forces an immediate network call regardless of state
      queryClient.refetchQueries({ queryKey: ['savedRepos'], type: 'active' });
      queryClient.refetchQueries({
        queryKey: ['dashboardData'],
        type: 'active',
      });
      queryClient.refetchQueries({ queryKey: ['repoDetails'], type: 'active' });
    };

    const channel = supabase
      .channel('global-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repositories' },
        (payload) => {
          forceRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roasts' },
        (payload) => {
          forceRefresh();
        }
      )
      .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
              console.error("[Realtime] Failed to connect to Supabase Realtime. Ensure Realtime is enabled for these tables in the Supabase Dashboard.");
          }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return <>{children}</>;
}