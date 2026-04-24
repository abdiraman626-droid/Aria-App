import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_KEY = 'aria_splash_played';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('black');
  // black → orb → type → life → shockwave → hold → fadeout → done
  const [typed, setTyped] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY)) {
      setVisible(false);
      onComplete();
      return;
    }

    // Timeline
    const timers = [
      setTimeout(() => setPhase('orb'),       300),   // 0.3s — orb scales in
      setTimeout(() => setPhase('type'),      1200),   // 1.2s — start typing ARIA
      setTimeout(() => setPhase('life'),      2600),   // 2.6s — LIFE fades in
      setTimeout(() => setPhase('shockwave'), 3400),   // 3.4s — ring expands
      setTimeout(() => setPhase('hold'),      4200),   // 4.2s — hold everything
      setTimeout(() => setPhase('fadeout'),   5400),   // 5.4s — fade to black
      setTimeout(() => {
        sessionStorage.setItem(SPLASH_KEY, '1');
        setVisible(false);
        onComplete();
      }, 6200),                                        // 6.2s — done
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Typewriter for ARIA
  useEffect(() => {
    if (phase !== 'type' && phase !== 'life' && phase !== 'shockwave' && phase !== 'hold' && phase !== 'fadeout') return;
    const letters = 'ARIA';
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(letters.slice(0, i));
      if (i >= letters.length) clearInterval(interval);
    }, 180);
    return () => clearInterval(interval);
  }, [phase === 'type']);

  if (!visible) return null;

  const showOrb = phase !== 'black';
  const showType = phase !== 'black' && phase !== 'orb';
  const showLife = phase === 'life' || phase === 'shockwave' || phase === 'hold' || phase === 'fadeout';
  const showShockwave = phase === 'shockwave' || phase === 'hold' || phase === 'fadeout';
  const fading = phase === 'fadeout';

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        animate={{ opacity: fading ? 0 : 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#060608',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow behind orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{
            opacity: showOrb ? 0.5 : 0,
            scale: showOrb ? 1.4 : 0.3,
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Orb — logo scales in with glow */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: showOrb ? 1 : 0,
            opacity: showOrb ? 1 : 0,
          }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 96, height: 96, borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 0 80px rgba(59,130,246,0.4), 0 0 160px rgba(124,58,237,0.15)',
            position: 'relative', zIndex: 2,
          }}
        >
          <img src="/logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </motion.div>

        {/* ARIA — types letter by letter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showType ? 1 : 0, y: showType ? 0 : 8 }}
          transition={{ duration: 0.4 }}
          style={{ marginTop: 28, position: 'relative', zIndex: 2 }}
        >
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(40px, 10vw, 64px)',
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: '#fff',
            lineHeight: 1,
            WebkitFontSmoothing: 'antialiased',
          }}>
            {typed}
            {typed.length < 4 && (
              <span style={{
                display: 'inline-block', width: 3, height: '0.8em',
                background: '#3b82f6', marginLeft: 3,
                verticalAlign: 'text-bottom',
                animation: 'blink 0.6s step-end infinite',
              }} />
            )}
          </h1>
        </motion.div>

        {/* LIFE — fades in below */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: showLife ? 1 : 0, y: showLife ? 0 : 6 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(13px, 2.5vw, 16px)',
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: '#7c3aed',
            marginTop: 8,
            position: 'relative', zIndex: 2,
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          LIFE
        </motion.p>

        {/* Shockwave ring */}
        <AnimatePresence>
          {showShockwave && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 200, height: 200, borderRadius: '50%',
                border: '2px solid rgba(59,130,246,0.35)',
                boxShadow: '0 0 30px rgba(59,130,246,0.15)',
                zIndex: 1,
              }}
            />
          )}
        </AnimatePresence>

        {/* Second shockwave — offset */}
        <AnimatePresence>
          {showShockwave && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1.6, ease: 'easeOut', delay: 0.15 }}
              style={{
                position: 'absolute',
                width: 160, height: 160, borderRadius: '50%',
                border: '1px solid rgba(124,58,237,0.25)',
                zIndex: 1,
              }}
            />
          )}
        </AnimatePresence>

        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </motion.div>
    </AnimatePresence>
  );
}
