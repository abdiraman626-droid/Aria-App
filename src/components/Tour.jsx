import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useTour } from '../context/TourContext';

export default function Tour() {
  const { active, step, steps, nextStep, skipTour } = useTour();
  const [rect, setRect]   = useState(null);
  const rafRef = useRef(null);

  const currentStep = steps[step];

  useEffect(() => {
    if (!active || !currentStep) { setRect(null); return; }

    const update = () => {
      const el = document.getElementById(currentStep.target);
      if (el) {
        // Scroll element into view first time step changes
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const r = el.getBoundingClientRect();
        setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      }
      rafRef.current = requestAnimationFrame(update);
    };

    // Give scroll time to complete before measuring
    const t = setTimeout(() => {
      rafRef.current = requestAnimationFrame(update);
    }, 350);

    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, step, currentStep?.target]);

  if (!active) return null;

  const PAD   = 10;
  const vw    = window.innerWidth;
  const vh    = window.innerHeight;
  const hl    = rect
    ? { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + PAD * 2, h: rect.h + PAD * 2 }
    : { x: vw / 2 - 60, y: vh / 2 - 30, w: 120, h: 60 };

  const midY      = hl.y + hl.h / 2;
  const inUpper   = midY < vh * 0.55;
  const tipH      = 196;
  const tipW      = Math.min(320, vw - 32);
  const tipX      = Math.max(16, Math.min(vw - tipW - 16, vw / 2 - tipW / 2));
  const tipY      = inUpper
    ? Math.min(vh - tipH - 16, hl.y + hl.h + 16)
    : Math.max(16, hl.y - tipH - 16);

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* SVG spotlight overlay */}
          <svg
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 1000 }}
            onClick={skipTour}
          >
            <defs>
              <mask id="tour-spotlight">
                <rect width="100%" height="100%" fill="white" />
                <rect x={hl.x} y={hl.y} width={hl.w} height={hl.h} rx="12" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.80)" mask="url(#tour-spotlight)" />
          </svg>

          {/* Animated highlight ring */}
          {rect && (
            <motion.div
              key={`ring-${step}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'fixed', zIndex: 1001, pointerEvents: 'none',
                left: hl.x, top: hl.y, width: hl.w, height: hl.h,
                borderRadius: 14,
                border: '2px solid #4F6EF7',
                boxShadow: '0 0 0 4px rgba(79,110,247,0.25), 0 0 24px rgba(79,110,247,0.3)',
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={`tip-${step}`}
            initial={{ opacity: 0, y: inUpper ? 12 : -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
              position: 'fixed', zIndex: 1002,
              left: tipX, top: tipY,
              width: tipW,
              background: 'var(--bg-card)',
              border: '1px solid rgba(79,110,247,0.35)',
              borderRadius: 20,
              padding: '18px 18px 14px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  height: 4, borderRadius: 2, transition: 'all 0.3s ease',
                  width: i === step ? 22 : 8,
                  background: i <= step ? '#4F6EF7' : 'var(--border)',
                }} />
              ))}
            </div>

            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-head)', lineHeight: 1.3 }}>
              {currentStep.title}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 16 }}>
              {currentStep.desc}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={skipTour}
                style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Skip tour
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
                  {step + 1} / {steps.length}
                </span>
                <button
                  onClick={nextStep}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '9px 18px',
                    borderRadius: 12, background: 'var(--blue)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    fontFamily: 'var(--font-body)',
                  }}>
                  {step === steps.length - 1 ? "Let's go!" : 'Next'}
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
