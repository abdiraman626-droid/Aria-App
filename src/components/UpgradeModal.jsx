import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Sparkles } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLAN_LABELS = {
  individual:      'Individual',
  corporate_mini:  'Corporate Mini',
  corporate:       'Corporate',
  major_corporate: 'Major Corporate',
  enterprise:      'Enterprise',
};

const PLAN_PRICES = {
  individual:      5000,
  corporate_mini:  15000,
  corporate:       30000,
  major_corporate: 100000,
  enterprise:      250000,
};

export default function UpgradeModal({ open, planId, onClose }) {
  const { user, updateUser, PLAN_META } = useAuth();
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  if (!open) return null;
  const planLabel = PLAN_LABELS[planId] || planId;
  const planPrice = PLAN_PRICES[planId] || 0;
  const planColor = PLAN_META?.[planId]?.color || '#3b82f6';

  const confirm = async () => {
    if (!user?.id) { toast.error('Sign in to switch plans'); return; }
    setSaving(true);
    try {
      // Update Firestore user doc with selected plan
      await updateDoc(doc(db, 'users', user.id), {
        plan: planId,
        monthlyPrice: planPrice,
      });
      // Sync local context
      await updateUser({ plan: planId, monthlyPrice: planPrice });
      setDone(true);
    } catch {
      toast.error('Could not switch plan. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 460,
            background: '#0f0f12', border: '1px solid #1a1a1f', borderRadius: 20,
            padding: 28, position: 'relative',
          }}
        >
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 10,
            width: 32, height: 32, cursor: 'pointer', color: '#888',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>

          {!done ? (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${planColor}18`, border: `1px solid ${planColor}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Sparkles size={20} style={{ color: planColor }} />
              </div>

              <h2 style={{
                fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700,
                color: '#fff', marginBottom: 8, letterSpacing: '-0.02em',
              }}>
                Switch to {planLabel}
              </h2>

              <p style={{ fontSize: 14, color: '#a0a0a8', lineHeight: 1.7, marginBottom: 18 }}>
                Payments coming soon — you're on the free trial for now. Confirm to switch your plan to <strong style={{ color: '#fff' }}>{planLabel}</strong> with full access.
              </p>

              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)',
                marginBottom: 22,
              }}>
                <p style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>
                  KSH {planPrice.toLocaleString()}/mo · Billed when payments launch
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} disabled={saving}
                  style={{
                    flex: 1, padding: '12px 18px', borderRadius: 10,
                    background: 'transparent', border: '1px solid #2a2a30',
                    color: '#a0a0a8', fontSize: 14, fontWeight: 500,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}>
                  Cancel
                </button>
                <button onClick={confirm} disabled={saving}
                  style={{
                    flex: 1, padding: '12px 18px', borderRadius: 10, border: 'none',
                    background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirm Switch
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Check size={24} style={{ color: '#22c55e' }} />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700,
                color: '#fff', marginBottom: 8, letterSpacing: '-0.02em',
              }}>
                You're on {planLabel}
              </h2>
              <p style={{ fontSize: 14, color: '#a0a0a8', lineHeight: 1.7, marginBottom: 22 }}>
                All {planLabel} features are unlocked. We'll email you when paid billing goes live — no charges until then.
              </p>
              <button onClick={onClose}
                style={{
                  width: '100%', padding: '12px 18px', borderRadius: 10, border: 'none',
                  background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                Got it
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
