import { useAuth } from '../context/AuthContext';

const LIMITS = {
  personal: { reminders: 20,       team: false, teamLimit: 0,        mpesa: false, customVoice: false, clientPortal: false },
  business: { reminders: Infinity, team: true,  teamLimit: 5,        mpesa: false, customVoice: false, clientPortal: false },
  premium:  { reminders: Infinity, team: true,  teamLimit: Infinity, mpesa: true,  customVoice: true,  clientPortal: true  },
};

export function usePlan() {
  const { user, PLAN_META } = useAuth();
  const plan    = user?.plan || 'personal';
  const limits  = LIMITS[plan] || LIMITS.personal;
  const meta    = PLAN_META[plan]  || PLAN_META.personal;

  return {
    plan,
    label:           meta.label,
    color:           meta.color,
    price:           meta.price,
    reminderLimit:   limits.reminders,
    hasTeam:         limits.team,
    teamLimit:       limits.teamLimit,
    hasMpesa:        limits.mpesa,
    hasCustomVoice:  limits.customVoice,
    hasClientPortal: limits.clientPortal,
    isPersonal:      plan === 'personal',
    isBusiness:      plan === 'business',
    isPremium:       plan === 'premium',
    canAddReminder: (currentCount) =>
      limits.reminders === Infinity || currentCount < limits.reminders,
    canAddMember: (currentCount) =>
      limits.teamLimit === Infinity || currentCount < limits.teamLimit,
  };
}
