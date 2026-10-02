'use client';

import { useEffect, useRef } from 'react';

interface NeuralCanvasProps {
  variant?: 'fullscreen' | 'cell';
  density?: 'normal' | 'dense';
}

/** Pre-renders a radial glow sprite to replace expensive ctx.shadowBlur per-node. */
function createGlowSprite(size = 80): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(232, 93, 117, 0.15)');
  grad.addColorStop(0.25, 'rgba(232, 93, 117, 0.09)');
  grad.addColorStop(0.5, 'rgba(232, 93, 117, 0.04)');
  grad.addColorStop(1, 'rgba(232, 93, 117, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export function NeuralCanvas({ variant = 'fullscreen', density = 'dense' }: NeuralCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create glow sprite once
    if (!glowRef.current) glowRef.current = createGlowSprite();

    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    if (variant === 'cell') {
      W = Math.max(W * 1.8, 1000);
      H = Math.max(H * 1.8, 800);
      canvas.width = W;
      canvas.height = H;
    }

    const isDense = density === 'dense';

    const NODE_COUNT = isDense ? 350 : 200;
    const CONN_DIST = isDense ? 180 : 150;
    const CONN_OPACITY = isDense ? 0.3 : 0.22;

    let cx = W / 2;
    let cy = H / 2;
    let radius = Math.min(W, H) * 0.44;

    const nodes: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      r: number;
      opacity: number;
      initAngle: number;
      dist: number;
      rotSpeed: number;
      wobbleAmp: number;
      wobbleFreq: number;
      wobblePhase: number;
    }> = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const initAngle = Math.random() * Math.PI * 2;
      const rVar = radius * (0.15 + Math.random() * 0.85);
      const x = cx + Math.cos(initAngle) * rVar;
      const y = cy + Math.sin(initAngle) * rVar;
      const r = 1.5 + Math.random() * 4.5;
      const opacity = 0.25 + Math.random() * 0.6;
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        r,
        opacity,
        initAngle,
        dist: rVar,
        rotSpeed: 0.00008 + Math.random() * 0.00015,
        wobbleAmp: 1.5 + Math.random() * 4,
        wobbleFreq: 0.0006 + Math.random() * 0.001,
        wobblePhase: Math.random() * Math.PI * 2,
      });
    }

    let rotationAngle = 0;
    let frameId = 0;
    let tick = 0;

    function animate() {
      if (!ctx) return;

      // 1. Pause when tab is hidden (saves GPU/CPU instantly)
      if (document.hidden) return;

      // 2. Throttle to ~30fps (skip every other frame — smooth enough for a decorative bg)
      tick++;
      if ((tick & 1) === 0) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      rotationAngle += 0.0003;

      // 3. Cache performance.now() once per frame instead of Date.now() × N
      const now = performance.now();

      // Update node positions: slow orbital rotation + wobble
      nodes.forEach((p) => {
        const currentAngle = p.initAngle + rotationAngle * (0.6 + p.dist / radius * 0.4);
        const wobbleX = Math.cos(now * p.wobbleFreq * 0.7 + p.wobblePhase) * p.wobbleAmp * 0.4;
        const wobbleY = Math.sin(now * p.wobbleFreq * 0.8 + p.wobblePhase * 1.3) * p.wobbleAmp * 0.4;
        p.x = cx + Math.cos(currentAngle) * p.dist + wobbleX;
        p.y = cy + Math.sin(currentAngle) * p.dist + wobbleY;
      });

      // Draw connections — O(n²) but with spatial skip for performance
      const connectionThreshold = CONN_DIST;
      for (let i = 0; i < nodes.length; i++) {
        const ni = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nj = nodes[j];
          // Quick bounding-box check
          if (Math.abs(ni.x - nj.x) > connectionThreshold || Math.abs(ni.y - nj.y) > connectionThreshold) continue;
          const dx = ni.x - nj.x;
          const dy = ni.y - nj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionThreshold) {
            const t = 1 - dist / connectionThreshold;
            const lineOpacity = t * t * CONN_OPACITY;
            const lineWidth = 0.3 + t * 1.0;
            ctx!.strokeStyle = `rgba(232, 93, 117, ${lineOpacity})`;
            ctx!.lineWidth = lineWidth;
            ctx!.beginPath();
            ctx!.moveTo(ni.x, ni.y);
            ctx!.lineTo(nj.x, nj.y);
            ctx!.stroke();
          }
        }
      }

      // 4. Draw nodes: glow sprite (cheap drawImage) + solid core (no shadowBlur)
      const glow = glowRef.current!;
      const glowHalf = glow.width / 2;
      nodes.forEach((p) => {
        // Glow stamp (pre-rendered radial gradient — 1 drawImage instead of shadowBlur)
        ctx!.globalAlpha = p.opacity * 0.85;
        ctx!.drawImage(glow, p.x - glowHalf, p.y - glowHalf);
        // Solid core circle
        ctx!.globalAlpha = 1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(232, 93, 117, ${p.opacity})`;
        ctx!.fill();
      });
      ctx!.globalAlpha = 1;

      frameId = requestAnimationFrame(animate);
    }

    // 5. Resume animation when tab becomes visible again
    const handleVisibility = () => {
      if (!document.hidden && !frameId) {
        frameId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animate();

    const handleResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      if (variant === 'cell') {
        W = Math.max(W * 1.8, 1000);
        H = Math.max(H * 1.8, 800);
      }
      canvas.width = W;
      canvas.height = H;

      // Re-center nodes for the new dimensions
      const newCx = W / 2;
      const newCy = H / 2;
      const newRadius = Math.min(W, H) * 0.44;
      const scale = newRadius / radius;
      nodes.forEach((p) => { p.dist *= scale; });
      cx = newCx;
      cy = newCy;
      radius = newRadius;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [variant, density]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  };

  if (variant === 'fullscreen') {
    return (
      <div style={{ ...baseStyle, position: 'fixed', inset: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  return (
    <div style={{ ...baseStyle, overflow: 'visible' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '225%',
          height: '225%',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: 'none',
        }}
      />
    </div>
  );
}