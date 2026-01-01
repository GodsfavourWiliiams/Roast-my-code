'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CtaButtonProps extends React.ComponentProps<typeof Button> {
  icon?: React.ElementType;
  label: string;
  href: string;
}

export function CtaButton({ icon: Icon, label, href, ...props }: CtaButtonProps) {
  return (
    <Link href={href}>
      <Button
        className="h-12 rounded-full bg-red-600 hover:bg-red-700 text-white px-10 font-medium text-base shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105"
        {...props}
      >
        {Icon && <Icon className="w-5 h-5 mr-2" />}
        {label}
      </Button>
    </Link>
  );
}
