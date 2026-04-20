import { useRef, useEffect, useState } from 'react';

export default function ParticleField({ count = 60, color = '#4F6EF7' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    setReady(true);
    window.addEventListener('resize', resize);

    const w = () => canvas.width / dpr;
    const h = () => canvas.height / dpr;

    // Init particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas.width / dpr),
      y: Math.random() * (canvas.height / dpr),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.5 + 0.8,
      alpha: Math.random() * 0.6 + 0.15,
    }));

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    window.addEventListener('mousemove', handleMouse);

    const draw = () => {
      const cw = w();
      const ch = h();
      ctx.clearRect(0, 0, cw, ch);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particlesRef.current.forEach(p => {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180 * 0.015;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.vy *= 0.995;

        if (p.x < 0) p.x = cw;
        if (p.x > cw) p.x = 0;
        if (p.y < 0) p.y = ch;
        if (p.y > ch) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Connections
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) {
            ctx.globalAlpha = 0.08 * (1 - d / 140);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [count, color]);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none',
      opacity: ready ? 0.8 : 0,
      transition: 'opacity 1s ease-in',
    }} />
  );
}
