'use client';

import { useEffect, useRef, useCallback } from 'react';

interface WordMarqueeProps {
  words?: string[];
}

const DEFAULT_WORDS = [
  "Bases de l'administration Windows", "JavaScript", 'Circuits logiques', "Anglais", 'Architecture SI', 'Mathématiques Générales',
];

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Original → scrambled, left to right
function startScramble(word: string, duration: number) {
  const start = performance.now();
  return (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const scrambleCount = Math.floor(progress * word.length);
    const text = word.split('').map((c, i) => {
      if (i < scrambleCount) return CHARS[Math.floor(Math.random() * CHARS.length)];
      return c;
    }).join('');
    return { text, done: progress >= 1 };
  };
}

// Scrambled → original, left to right
function startUnscramble(word: string, duration: number) {
  const start = performance.now();
  return (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const revealCount = Math.floor(progress * word.length);
    const text = word.split('').map((c, i) => {
      if (i < revealCount) return c;
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join('');
    return { text, done: progress >= 1 };
  };
}

// Continuous full-word scramble (all chars random, every frame)
function startScrambled(word: string, duration: number) {
  const start = performance.now();
  return (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const text = word.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    return { text, done: progress >= 1 };
  };
}

const REST_MS = 2500;
const SCRAMBLE_DURATION = 2500; // slow, left-to-right
const UNSCRAMBLE_DURATION = 2500; // slow, left-to-right
const SCRAMBLED_MIN_MS = 1000;
const SCRAMBLED_MAX_MS = 3000;

interface WordItem {
  el: HTMLSpanElement;
  word: string;
  x: number;
  speed: number;
  wordW: number;
  state: 'resting' | 'scrambling' | 'scrambled' | 'unscrambling';
  stepFn: ((now: number) => { text: string; done: boolean }) | null;
  stateEnd: number;
}

export function WordMarquee({ words = DEFAULT_WORDS }: WordMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const renderWords = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;
    const fontSize = Math.max(14, Math.min(22, containerW / 30));
    const charWidth = fontSize * 0.6;

    const items: WordItem[] = [];

    words.forEach((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      span.style.cssText = `
        position: absolute;
        white-space: nowrap;
        font-size: ${fontSize}px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--accent);
        pointer-events: none;
        user-select: none;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        will-change: transform;
      `;

      const wordW = word.length * charWidth;
      const y = Math.random() * (containerH - fontSize - 20) + 10;
      const startX = Math.random() * containerW;
      const speed = 0.12 + Math.random() * 0.18;
      // Brighter words for visibility — randomly assign higher opacity
      const opacityRand = Math.random();
      const opacity = opacityRand < 0.25 ? 0.55 : opacityRand < 0.6 ? 0.40 : 0.30;
      const x = startX;

      span.style.top = `${y}px`;
      span.style.left = '0px';
      span.style.opacity = `${opacity}`;
      container.appendChild(span);

      items.push({
        el: span,
        word,
        x,
        speed,
        wordW,
        state: 'resting',
        stepFn: null,
        stateEnd: performance.now() + Math.random() * REST_MS,
      });
    });

    let rafId: number;

    function animate() {
      const now = performance.now();

      items.forEach((item) => {
        // Move left
        item.x -= item.speed;
        if (item.x + item.wordW < 0) {
          item.x = containerW + Math.random() * 200;
          item.el.textContent = item.word;
          item.state = 'resting';
          item.stateEnd = now + REST_MS;
          item.stepFn = null;
          item.el.style.top = `${Math.random() * (containerH - fontSize - 20) + 10}px`;
        }
        item.el.style.transform = `translateX(${item.x}px)`;

        // Scramble cycle: resting → scrambling → scrambled → unscrambling → resting
        if (item.state === 'resting') {
          if (now >= item.stateEnd) {
            item.state = 'scrambling';
            item.stepFn = startScramble(item.word, SCRAMBLE_DURATION);
          }
        } else if (item.state === 'scrambling' && item.stepFn) {
          const result = item.stepFn(now);
          item.el.textContent = result.text;
          if (result.done) {
            const holdMs = SCRAMBLED_MIN_MS + Math.random() * (SCRAMBLED_MAX_MS - SCRAMBLED_MIN_MS);
            item.state = 'scrambled';
            item.stepFn = startScrambled(item.word, holdMs);
          }
        } else if (item.state === 'scrambled' && item.stepFn) {
          const result = item.stepFn(now);
          item.el.textContent = result.text;
          if (result.done) {
            item.state = 'unscrambling';
            item.stepFn = startUnscramble(item.word, UNSCRAMBLE_DURATION);
          }
        } else if (item.state === 'unscrambling' && item.stepFn) {
          const result = item.stepFn(now);
          item.el.textContent = result.text;
          if (result.done) {
            item.el.textContent = item.word;
            item.state = 'resting';
            item.stepFn = null;
            item.stateEnd = now + REST_MS;
          }
        }
      });

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [words]);

  useEffect(() => {
    const cleanup = renderWords();
    const handleResize = () => renderWords();
    window.addEventListener('resize', handleResize);
    return () => {
      cleanup?.();
      window.removeEventListener('resize', handleResize);
    };
  }, [renderWords]);

  return (
    <div
      ref={containerRef}
      className="word-marquee"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
      }}
    />
  );
}
