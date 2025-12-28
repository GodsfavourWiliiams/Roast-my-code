'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  { text: '$ initiating_handshake...', color: 'text-green-500' },
  { text: '$ scanning_ports... [OPEN]', color: 'text-yellow-500' },
  { text: '$ awaiting_credentials...', color: 'text-slate-400' },
  { text: '$ detecting_incompetence... [HIGH]', color: 'text-red-500' },
  { text: '$ bypassing_firewall...', color: 'text-blue-500' },
  { text: '$ downloading_judgment_module...', color: 'text-purple-500' },
  { text: '$ analyzing_spaghetti_code...', color: 'text-orange-500' },
];

export function TerminalFeed({ isLoading }: { isLoading: boolean }) {
  const [lines, setLines] = useState<typeof messages>([messages[0]]);
  
  useEffect(() => {
    let currentIndex = 1;
    
    const interval = setInterval(() => {
      setLines((prev) => {
        const nextLine = messages[currentIndex % messages.length];
        // Keep only last 4 lines to prevent overflow and keep it looking "fresh"
        const newLines = [...prev, nextLine].slice(-4);
        currentIndex++;
        return newLines;
      });
    }, 2000); // Add a new line every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/90 p-4 border border-border/50 font-mono text-xs text-left space-y-1.5 rounded-md shadow-inner min-h-[120px] overflow-hidden relative">
        <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
        <AnimatePresence initial={false} mode='popLayout'>
            {lines.map((line, i) => (
                <motion.p
                    key={`${line.text}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`${line.color} truncate`}
                >
                    {line.text}
                </motion.p>
            ))}
        </AnimatePresence>
        
        {isLoading && (
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-primary font-bold italic"
            >
                # verifying_ego_levels...
            </motion.p>
        )}
        <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-green-500 font-bold"
        >
            _
        </motion.span>
    </div>
  );
}
