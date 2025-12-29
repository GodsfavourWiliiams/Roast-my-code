"use client"

import { useEffect } from "react"
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

  // 1. Fetch Notifications
  const { data: notifications = [], isLoading } = useQuery({
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

  // 3. Realtime Subscription
  useEffect(() => {
    // Pre-load audio
    const audio = new Audio('https://fsa.zobj.net/download/f0/ea/f0ea0cf66009edbc0bc0af96548d0772.mp3?download=1'); // Modern ping sound
    audio.load();

    const playSound = () => {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Sound blocked by browser. Interaction required.", e));
    };

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log("[Notification] New alert:", payload.new);
          playSound();
          toast(payload.new.title, {
            description: payload.new.message,
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
            {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{unreadCount} New</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
            {isLoading ? (
                <div className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading notifications...</p>
                    </div>
                </div>
            ) : notifications.length === 0 ? (
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
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
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
