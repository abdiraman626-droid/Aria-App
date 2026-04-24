import { motion } from 'framer-motion';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';

const META = {
  corporate_mini:  { color: '#7c3aed', label: 'Corporate Mini',  price: 'KSH 15,000/mo' },
  corporate:       { color: '#22c55e', label: 'Corporate',       price: 'KSH 30,000/mo' },
  major_corporate: { color: '#f59e0b', label: 'Major Corporate', price: 'KSH 100,000/mo' },
  enterprise:      { color: '#ef4444', label: 'Enterprise',      price: 'KSH 250,000/mo' },
};

export default function UpgradePrompt({ feature, requiredPlan = 'corporate_mini', compact = false }) {
  const { plan } = usePlan();
  const planOrder = ['individual', 'corporate_mini', 'corporate', 'major_corporate', 'enterprise'];
  const userIdx = planOrder.indexOf(plan);
  const requiredIdx = planOrder.indexOf(requiredPlan);
  // User already has access
  if (userIdx >= requiredIdx) return null;

  const p = META[requiredPlan] || META.corporate_mini;

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderRadius: 12, background: `${p.color}10`, border: `1px solid ${p.color}30`,
      }}>
        <Lock size={13} color={p.color} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
          {feature} · <strong style={{ color: p.color }}>{p.label} plan</strong>
        </span>
        <Link to="/settings" style={{
          fontSize: 12, fontWeight: 700, color: p.color, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
        }}>
          Upgrade <ArrowRight size={11} />
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '28px 20px', borderRadius: 16, textAlign: 'center',
        background: `${p.color}08`, border: `1px solid ${p.color}25`,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: `${p.color}18`,
        border: `1px solid ${p.color}35`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <Lock size={20} color={p.color} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{feature}</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Unlock this with the <strong style={{ color: p.color }}>{p.label} plan</strong> — {p.price}
      </p>
      <Link
        to="/settings"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px',
          borderRadius: 12, background: p.color, color: '#fff',
          textDecoration: 'none', fontWeight: 700, fontSize: 14,
        }}
      >
        <Zap size={14} /> Upgrade to {p.label}
      </Link>
    </motion.div>
  );
}
