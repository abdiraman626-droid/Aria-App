import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Bell, Mic, Settings, Users, Video, Calendar } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useLang } from '../context/LangContext';

export default function BottomNav() {
  const location = useLocation();
  const { hasTeam, hasMeetingRecorder } = usePlan();
  const { t } = useLang();

  const TABS = {
    home:     { to: '/dashboard', icon: Home,     label: t('home')      },
    remind:   { to: '/reminders', icon: Bell,     label: t('reminders') },
    calendar: { to: '/calendar',  icon: Calendar, label: t('calendar')  },
    voice:    { to: '/voice',     icon: Mic,      label: t('voice')     },
    settings: { to: '/settings',  icon: Settings, label: t('settings')  },
    team:     { to: '/team',      icon: Users,    label: t('team')      },
    meetings: { to: '/meetings',  icon: Video,    label: t('meetings')  },
  };

  const tabs = [
    TABS.home,
    TABS.calendar,
    TABS.remind,
    ...(hasTeam ? [TABS.team] : []),
    ...(hasMeetingRecorder ? [TABS.meetings] : []),
    TABS.voice,
    TABS.settings,
  ].slice(0, 6);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{ background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1" style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom,0px))' }}>
        {tabs.map(tab => {
          const active = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              id={tab.to === '/settings' ? 'tour-nav-settings' : undefined}
              className="flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all min-h-[48px] justify-center relative">
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-2 inset-y-0 rounded-xl"
                  style={{ background: 'rgba(79,110,247,0.12)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <tab.icon
                size={22}
                strokeWidth={active ? 2.2 : 1.6}
                style={{ color: active ? '#4F6EF7' : '#505068', position: 'relative' }}
              />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#4F6EF7' : '#505068', position: 'relative', fontFamily: 'var(--font-body)' }}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
