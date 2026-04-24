import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TAGLINE = 'Your AI-Powered Business Assistant';
const SPLASH_KEY = 'aria_splash_seen';

// Minimal star/particle canvas — no Three.js, instant load
function Stars({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (t) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      stars.forEach(s => {
        s.a = 0.3 + Math.sin(t * 0.001 * s.speed + s.phase) * 0.4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${s.a})`;
        ctx.fill();
      });
      // A few purple stars
      stars.slice(0, 30).forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x + 1, s.y + 1, s.r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124,58,237,${s.a * 0.5})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, [canvasRef]);

  return null;
}

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('stars');   // stars → logo → tagline → fadeout → done
  const [typedText, setTypedText] = useState('');
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef(null);

  // Check localStorage — skip if already seen
  useEffect(() => {
    if (localStorage.getItem(SPLASH_KEY)) {
      setVisible(false);
      onComplete();
      return;
    }

    // Phase timeline
    const t1 = setTimeout(() => setPhase('logo'), 400);
    const t2 = setTimeout(() => setPhase('tagline'), 1200);
    const t3 = setTimeout(() => setPhase('fadeout'), 3200);
    const t4 = setTimeout(() => {
      localStorage.setItem(SPLASH_KEY, '1');
      setVisible(false);
      onComplete();
    }, 3800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'tagline' && phase !== 'fadeout') return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(TAGLINE.slice(0, i));
      if (i >= TAGLINE.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [phase]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'fadeout' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#060611',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Star field */}
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <Stars canvasRef={canvasRef} />

          {/* Radial glow behind logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: phase === 'logo' || phase === 'tagline' || phase === 'fadeout' ? 0.6 : 0, scale: 1.2 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 400, height: 400, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(124,58,237,0.08) 40%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Pulsing ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: phase === 'logo' || phase === 'tagline' ? [0.4, 0.15, 0.4] : 0,
              scale: phase === 'logo' || phase === 'tagline' ? [0.9, 1.15, 0.9] : 0.6,
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: 200, height: 200, borderRadius: '50%',
              border: '2px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 40px rgba(59,130,246,0.15)',
            }}
          />

          {/* Second ring (offset timing) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: phase === 'logo' || phase === 'tagline' ? [0.2, 0.08, 0.2] : 0,
              scale: phase === 'logo' || phase === 'tagline' ? [1.1, 1.4, 1.1] : 0.8,
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              position: 'absolute',
              width: 260, height: 260, borderRadius: '50%',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{
              opacity: phase === 'stars' ? 0 : 1,
              scale: phase === 'stars' ? 0.7 : 1,
              y: 0,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            {/* Logo icon */}
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 60px rgba(59,130,246,0.4), 0 0 120px rgba(124,58,237,0.15)',
            }}>
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                <path d="M50 18a22 22 0 0 0-22 22c0 24-11 30-11 30h66s-11-6-11-30A22 22 0 0 0 50 18z" fill="white" fillOpacity="0.95"/>
                <path d="M42 82a9 9 0 0 0 16 0" fill="white" fillOpacity="0.95"/>
              </svg>
            </div>

            {/* Logo text */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: phase === 'stars' ? 0 : 1, y: phase === 'stars' ? 8 : 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 'clamp(36px, 8vw, 52px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #fff 30%, #A0A0B8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ARIA Life
            </motion.h1>
          </motion.div>

          {/* Tagline — typewriter */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'tagline' || phase === 'fadeout' ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'relative',
              marginTop: 20,
              fontSize: 'clamp(14px, 3vw, 18px)',
              color: '#A0A0B8',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              letterSpacing: '0.01em',
              textAlign: 'center',
              padding: '0 24px',
              minHeight: 28,
            }}
          >
            {typedText}
            {typedText.length < TAGLINE.length && (
              <span style={{
                display: 'inline-block', width: 2, height: '1em',
                background: '#3b82f6', marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'blink 0.7s step-end infinite',
              }} />
            )}
          </motion.p>

          <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
