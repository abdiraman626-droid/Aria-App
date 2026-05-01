import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Mic, Settings, Video, Calendar, Lightbulb, MessageSquare } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function BottomNav() {
  const location = useLocation();
  const { t, lang } = useLang();

  // 7 tabs in fixed order: Home · Calendar · Meetings · Voice · Strategy · Feedback · Settings
  const tabs = [
    { to: '/dashboard',   icon: Home,           label: t('home')     },
    { to: '/calendar',    icon: Calendar,       label: t('calendar') },
    { to: '/meetings',    icon: Video,          label: t('meetings') },
    { to: '/voice',       icon: Mic,            label: t('voice')    },
    { to: '/strategy',    icon: Lightbulb,      label: lang === 'ar' ? 'استراتيجية' : lang === 'so' ? 'Istiraatiiji' : lang === 'sw' ? 'Mkakati' : 'Strategy' },
    { to: '/suggestions', icon: MessageSquare,  label: lang === 'ar' ? 'اقتراح' : lang === 'so' ? 'Talo' : lang === 'sw' ? 'Pendekezo' : 'Feedback' },
    { to: '/settings',    icon: Settings,       label: t('settings') },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'stretch',
        width: '100%',
        padding: '8px 0',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      }}>
        {tabs.map(tab => {
          const active = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              id={tab.to === '/settings' ? 'tour-nav-settings' : undefined}
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '4px 2px',
                position: 'relative',
                textDecoration: 'none',
                minHeight: 48,
              }}>
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: 'absolute', top: 2, bottom: 2, left: 4, right: 4,
                    borderRadius: 10,
                    background: 'rgba(59,130,246,0.12)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <tab.icon
                size={20}
                strokeWidth={active ? 2.2 : 1.6}
                style={{ color: active ? '#3b82f6' : '#505068', position: 'relative', flexShrink: 0 }}
              />
              <span style={{
                fontSize: 10,
                lineHeight: 1.1,
                fontWeight: active ? 600 : 400,
                color: active ? '#3b82f6' : '#505068',
                position: 'relative',
                fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                display: 'block',
              }}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
