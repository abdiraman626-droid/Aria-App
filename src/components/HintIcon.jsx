import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HintIcon({ hint, position = 'top' }) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title="What is this?"
        style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, flexShrink: 0, fontFamily: 'var(--font-body)',
        }}>
        ?
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop dismiss */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 200 }}
              onClick={() => setOpen(false)}
            />
            {/* Popover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: position === 'top' ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                position: 'absolute', zIndex: 201,
                ...(position === 'top'
                  ? { bottom: 'calc(100% + 8px)' }
                  : { top: 'calc(100% + 8px)' }),
                left: '50%', transform: 'translateX(-50%)',
                width: 230,
                background: 'var(--bg-card)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 14,
                padding: '12px 14px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55,
                fontFamily: 'var(--font-body)',
                pointerEvents: 'all',
              }}>
              {/* Arrow */}
              <div style={{
                position: 'absolute',
                ...(position === 'top' ? { bottom: -6, top: 'auto' } : { top: -6, bottom: 'auto' }),
                left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                ...(position === 'top'
                  ? { borderTop: '6px solid rgba(59,130,246,0.3)' }
                  : { borderBottom: '6px solid rgba(59,130,246,0.3)' }),
              }} />
              {hint}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
