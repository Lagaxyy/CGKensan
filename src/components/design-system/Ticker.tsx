'use client';

import { useEffect, useState } from 'react';

interface TickerProps {
  value: string | number;
  suffix?: string;
  label: string;
}

export function Ticker({ value, suffix = '', label }: TickerProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const targetValue = typeof value === 'string' ? parseInt(value, 10) : value;

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();

    function step(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = Math.floor((1 - Math.pow(1 - p, 3)) * targetValue);
      setDisplayValue(eased.toString());
      if (p < 1) {
        requestAnimationFrame(step);
      }
    }

    // Start after a small delay
    const timeout = setTimeout(() => {
      requestAnimationFrame(step);
    }, 400);

    return () => clearTimeout(timeout);
  }, [targetValue]);

  return (
    <>
      <div className="cell-glyph ticker-value" style={{
        fontSize: 'clamp(28px, 3.5vw, 52px)',
        fontWeight: 700,
        lineHeight: 0.9,
        color: 'var(--accent)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {displayValue}{suffix}
      </div>
      <div className="cell-label" style={{
        fontSize: '11px',
        color: 'var(--fg-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginTop: 8,
      }}>
        {label}
      </div>
    </>
  );
}
