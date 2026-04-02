import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, ArrowLeft, ExternalLink } from 'lucide-react';

export default function LegalPage({ title, lastUpdated, children }) {
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(24px)', zIndex: 50 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#4F6EF7,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={14} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: '#fff' }}>ARIA</span>
        </Link>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
          <ArrowLeft size={16} /> Back
        </button>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Title block */}
        <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            ARIA Assistant · Nairobi, Kenya · Last updated: {lastUpdated}
          </p>
        </div>

        {/* Page body */}
        <div style={{ lineHeight: 1.75, fontSize: 15, color: 'var(--text-secondary)' }}>
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px 28px', marginBottom: 12 }}>
          <Link to="/privacy" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Privacy Policy</Link>
          <Link to="/terms"   style={{ fontSize: 14, color: 'var(--text-muted)' }}>Terms of Service</Link>
          <Link to="/cookies" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Cookie Policy</Link>
          <a href="mailto:support@ariaassistant.co.ke" style={{ fontSize: 14, color: 'var(--text-muted)' }}>support@ariaassistant.co.ke</a>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', opacity: 0.6 }}>© {new Date().getFullYear()} ARIA Assistant. Built for Kenya.</p>
      </footer>
    </div>
  );
}

/** Reusable section heading */
export function LSection({ title }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 44, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      {title}
    </h2>
  );
}

/** Reusable sub-heading */
export function LSub({ children }) {
  return <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginTop: 22, marginBottom: 8 }}>{children}</h3>;
}

/** Reusable paragraph */
export function LP({ children }) {
  return <p style={{ marginBottom: 14 }}>{children}</p>;
}

/** Reusable unordered list */
export function LList({ items }) {
  return (
    <ul style={{ paddingLeft: 20, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

/** Info box */
export function LBox({ children, color = '#4F6EF7' }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
      {children}
    </div>
  );
}
