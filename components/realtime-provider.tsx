"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    console.log("[Realtime] Starting global subscription...");

    const channel = supabase
      .channel('global-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repositories' },
        (payload) => {
          console.log("[Realtime] Repository change detected:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['savedRepos'] });
          queryClient.invalidateQueries({ queryKey: ['repoDetails'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roasts' },
        (payload) => {
          console.log("[Realtime] Roast change detected:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['recentRoasts'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
          queryClient.invalidateQueries({ queryKey: ['repoDetails'] });
        }
      )
      .subscribe();

    return () => {
      console.log("[Realtime] Cleaning up global subscription...");
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return <>{children}</>;
}
