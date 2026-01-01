"use client"

import { useState, useEffect, useRef } from "react"
import { BellIcon, CircleIcon } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export function NotificationBell() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // 1. Fetch Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // 2. Mark as Read Mutation
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // 3. Audio & Realtime
  useEffect(() => {
    // Initialize audio object once
    audioRef.current = new Audio('/notification.wav');
    audioRef.current.load();

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
                console.warn("[Notification] Playback blocked. User must interact with the page first.", e);
            });
        }
    };

    // Global listener to unlock audio on first click
    const unlockAudio = () => {
        if (audioRef.current) {
            // Play a silent or very short clip to unlock
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                setAudioUnlocked(true);
                window.removeEventListener('click', unlockAudio);
                console.log("[Notification] Audio unlocked.");
            }).catch(() => {});
        }
    };
    window.addEventListener('click', unlockAudio);

    const channel = supabase
      .channel('notif-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log("[Notification] Incoming:", payload.new);
          playSound();
          toast(payload.new.title, {
            description: payload.new.message,
          });
          // Force immediate refetch
          queryClient.refetchQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('click', unlockAudio);
    };
  }, [supabase, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon size={20} weight={unreadCount > 0 ? "fill" : "regular"} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {!audioUnlocked && <span className="text-[8px] text-muted-foreground uppercase tracking-tighter animate-pulse">Click anywhere to enable sound</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
            {notifications.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                    Your record is clean. For now.
                </div>
            ) : (
                <div className="flex flex-col">
                    {notifications.map((n) => (
                        <DropdownMenuItem 
                            key={n.id} 
                            onSelect={() => markAsRead(n.id)}
                            className={`flex flex-col items-start gap-1 p-4 cursor-pointer border-b last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-sm flex items-center gap-2">
                                    {!n.read && <CircleIcon weight="fill" size={8} className="text-primary" />}
                                    {n.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground text-nowrap ml-2">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {n.message}
                            </p>
                            {n.link && (
                                <Link href={n.link} className="text-[10px] text-primary hover:underline mt-1">
                                    View Details
                                </Link>
                            )}
                        </DropdownMenuItem>
                    ))}
                </div>
            )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}