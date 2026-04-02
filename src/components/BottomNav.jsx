import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Bell, Mic, Settings, Users, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MEETINGS_TAB = { to: '/meetings', icon: Video,    label: 'Meetings'  };
const TEAM_TAB     = { to: '/team',     icon: Users,    label: 'Team'      };

const BASE_TABS = [
  { to: '/dashboard', icon: Home,     label: 'Home'      },
  { to: '/reminders', icon: Bell,     label: 'Reminders' },
  { to: '/voice',     icon: Mic,      label: 'Voice'     },
  { to: '/settings',  icon: Settings, label: 'Settings'  },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const isTeamPlan = user?.plan === 'business' || user?.plan === 'premium';

  // Personal: Home, Reminders, Meetings, Voice, Settings (5)
  // Business/Premium: Home, Reminders, Team, Meetings, Voice (5)
  const tabs = isTeamPlan
    ? [BASE_TABS[0], BASE_TABS[1], TEAM_TAB, MEETINGS_TAB, BASE_TABS[2], BASE_TABS[3]]
    : [BASE_TABS[0], BASE_TABS[1], MEETINGS_TAB, BASE_TABS[2], BASE_TABS[3]];

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
