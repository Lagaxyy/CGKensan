'use client';

import { ReactNode } from 'react';

interface MobileSectionProps {
  children: ReactNode;
  className?: string;
  isCentered?: boolean;
}

export function MobileSection({ children, className = '', isCentered = false }: MobileSectionProps) {
  const style: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: isCentered ? 'center' : 'flex-end',
    padding: '0 24px 60px 24px',
    position: 'relative',
    zIndex: 2,
    scrollSnapAlign: 'start',
  };

  return (
    <section className={className} style={style}>
      {children}
    </section>
  );
}
