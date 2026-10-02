'use client';

import { useEffect, useRef } from 'react';

export function CursorTrail() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const mouseRef = useRef({ x: -100, y: -100 });
  const readyRef = useRef(false);
  const TRAIL_MAX = 15;

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!readyRef.current) readyRef.current = true;
    };

    document.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const updateTrail = () => {
      if (!readyRef.current) {
        animationId = requestAnimationFrame(updateTrail);
        return;
      }

      pointsRef.current.unshift({ ...mouseRef.current });
      if (pointsRef.current.length > TRAIL_MAX) {
        pointsRef.current.pop();
      }

      if (pointsRef.current.length > 2) {
        const pts = pointsRef.current;
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          d += ` Q ${pts[i].x} ${pts[i].y} ${xc} ${yc}`;
        }
        path.setAttribute('d', d);
      }

      animationId = requestAnimationFrame(updateTrail);
    };

    updateTrail();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 40,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trailGrad" x1="0" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0} />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity={0.6} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={1} />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d=""
        fill="none"
        stroke="url(#trailGrad)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }}
      />
    </svg>
  );
}
