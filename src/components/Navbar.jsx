import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, Globe, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const nextLang = () => {
    const order = ['en', 'sw', 'so', 'ar'];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang(next);
  };
  const langLabel = { en: 'English', sw: 'Kiswahili', so: 'Soomaali', ar: 'العربية' };
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="container flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4F6EF7,#8B5CF6)' }}>
            <Bell size={15} className="text-white" />
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: '#fff' }}>ARIA</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {!user && (
            <>
              <a href="#features" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>Features</a>
              <a href="#pricing" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>Pricing</a>
            </>
          )}
          <button onClick={nextLang} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Globe size={15} />
            {langLabel[lang]}
          </button>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#4F6EF7,#8B5CF6)' }}>
                  {user.avatar}
                </div>
                <span className="text-sm text-white font-medium">{user.name.split(' ')[0]}</span>
                <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
              <AnimatePresence>
                {dropOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-white text-sm font-semibold">{user.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                    <Link to="/settings" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      Settings
                    </Link>
                    <button onClick={() => { logout(); navigate('/'); setDropOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-red-900/10 transition-colors" style={{ color: '#ef4444' }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Start Free Trial</Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger — only on landing (no bottom nav) */}
        {!user && (
          <button className="md:hidden p-2" style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && !user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-white py-1">Features</a>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-white py-1">Pricing</a>
              <button onClick={nextLang} className="text-left py-1" style={{ color: 'var(--text-secondary)' }}>
                Language: {langLabel[lang]}
              </button>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-ghost w-full">Sign In</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn btn-primary w-full">Start Free Trial</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
