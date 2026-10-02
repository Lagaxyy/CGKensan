'use client';

import Link from 'next/link';
import { ReactNode, useState, useRef, useEffect } from 'react';

interface GridCellProps {
  children: ReactNode;
  column: string;
  row: string;
  variant?: 'default' | 'accent' | 'logo' | 'cta' | 'secondary-cta';
  href?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
}

export function GridCell({
  children,
  column,
  row,
  variant = 'default',
  href,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style
}: GridCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  // Find TextScramble elements and update their hover state
  useEffect(() => {
    if (!cellRef.current) return;

    const updateScrambleElements = () => {
      const scrambleElements = cellRef.current?.querySelectorAll('.text-scramble');
      scrambleElements?.forEach((el) => {
        if (isHovered) {
          el.setAttribute('data-hovered', 'true');
        } else {
          el.setAttribute('data-hovered', 'false');
        }
      });
    };

    updateScrambleElements();
  }, [isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeave?.();
  };
  const baseStyle: React.CSSProperties = {
    gridColumn: column,
    gridRow: row,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: variant === 'logo' ? 'center' : 'flex-end',
    alignItems: variant === 'logo' ? 'center' : 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    cursor: href || onClick ? 'pointer' : 'default',
    transition: 'background 0.4s ease',
    userSelect: 'none',
    background: variant === 'accent' || variant === 'cta' ? 'var(--accent)' : variant === 'secondary-cta' ? 'var(--cta-secondary)' : 'var(--bg)',
    ...style,
  };

  const content = (
    <div
      ref={cellRef}
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`grid-cell ${variant === 'cta' ? 'cta-cell' : ''} ${variant === 'accent' ? 'accent-cell' : ''} ${variant === 'logo' ? 'logo-cell' : ''} ${variant === 'secondary-cta' ? 'secondary-cta-cell' : ''}`}
    >
      <style jsx global>{`
        .grid-cell:not(.cta-cell):not(.accent-cell):not(.secondary-cta-cell):not(.logo-cell):hover .cell-glyph {
          color: var(--accent) !important;
          transform: translateY(-12px) !important;
          willChange: transform;
        }
        .grid-cell:not(.cta-cell):not(.accent-cell):not(.secondary-cta-cell):not(.logo-cell):hover .cell-label {
          color: var(--fg-dim) !important;
          transform: scaleY(1) !important;
          opacity: 1 !important;
        }
        .secondary-cta-cell:hover {
          background: var(--accent-soft) !important;
        }
        .secondary-cta-cell:hover .cell-glyph {
          color: var(--accent) !important;
        }
        .cell-glyph {
          willChange: transform;
          backface-visibility: hidden;
        }
      `}</style>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: 'contents', textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }

  return content;
}

// Sub-components for cell content
interface CellContentProps {
  glyph?: React.ReactNode;
  label?: React.ReactNode;
  variant?: 'default' | 'accent' | 'cta' | 'secondary-cta';
}

export function CellContent({ glyph, label, variant = 'default' }: CellContentProps) {
  const isAccent = variant === 'accent' || variant === 'cta';
  const isSecondaryCta = variant === 'secondary-cta';
  const glyphStyle: React.CSSProperties = {
    fontSize: variant === 'cta' ? 'clamp(20px, 2.5vw, 36px)' : 'clamp(28px, 3.5vw, 52px)',
    fontWeight: 700,
    lineHeight: 0.95,
    letterSpacing: '-0.03em',
    color: isAccent ? 'white' : isSecondaryCta ? 'var(--fg)' : 'var(--fg)',
    transition: 'all 0.6s cubic-bezier(0.23,1,0.32,1)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: isAccent ? 'rgba(255,255,255,0.7)' : isSecondaryCta ? 'var(--fg-dim)' : 'var(--fg-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginTop: 8,
    transform: isAccent || isSecondaryCta ? 'scaleY(1)' : 'scaleY(0)',
    transformOrigin: 'top',
    opacity: isAccent || isSecondaryCta ? 1 : 0,
    transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1) 0.15s, opacity 0.35s cubic-bezier(0.23,1,0.32,1) 0.15s',
    willChange: 'transform, opacity',
  };

  return (
    <>
      {glyph && <div className="cell-glyph" style={{ ...glyphStyle, transition: 'all 0.5s cubic-bezier(0.23,1,0.32,1)', transform: 'translateY(0)' }}>{glyph}</div>}
      {label && <div className="cell-label text-scramble-wrapper" style={labelStyle}>{label}</div>}
    </>
  );
}