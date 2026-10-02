'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface TextScrambleProps {
  children: string;
  className?: string;
  active?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const DURATION = 1200; // ms — total scramble duration

export function TextScramble({ children, className, active = false }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(children);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  const triggerScramble = useCallback(() => {
    const original = children;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startTimeRef.current = performance.now();

    function animate(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const revealCount = Math.floor(eased * original.length);

      setDisplayText(
        original.split('').map((c, i) => {
          if (i < revealCount) return original[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('')
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(original);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [children]);

  useEffect(() => {
    const element = spanRef.current;
    if (!element) return;

    if (active) {
      triggerScramble();
    } else {
      setDisplayText(children);
    }

    let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-hovered') {
          const isHovered = element.getAttribute('data-hovered') === 'true';
          if (isHovered) {
            // Delay scramble to let CSS transitions (translateY, scaleY) settle first
            hoverTimeout = setTimeout(() => {
              triggerScramble();
            }, 200);
          } else {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setDisplayText(children);
          }
        }
      });
    });

    observer.observe(element, { attributes: true });

    return () => {
      observer.disconnect();
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [children, active, triggerScramble]);

  return (
    <span
      ref={spanRef}
      className={`text-scramble ${className || ''}`}
      data-hovered="false"
      style={{ display: 'inline-block' }}
    >
      {displayText}
    </span>
  );
}