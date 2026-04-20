import { useAuth } from '../context/AuthContext';

// ══════════════════════════════════════════════════════════════════════
// TESTING MODE: All features unlocked on all plans.
// TODO: Restore proper gating when payments are integrated.
// ═══════��═══════════════════��══════════════════════════════════════════
const ALL_UNLOCKED = {
  reminders: Infinity, team: true, teamLimit: Infinity, whatsapp: true,
  mpesa: true, customVoice: true, clientPortal: true, emailSummaries: true,
  meetingRecorder: true, analytics: true, workflows: true,
};

const LIMITS = {
  individual:      ALL_UNLOCKED,
  corporate_mini:  ALL_UNLOCKED,
  corporate:       ALL_UNLOCKED,
  major_corporate: ALL_UNLOCKED,
  enterprise:      ALL_UNLOCKED,
};

export function usePlan() {
  const { user, PLAN_META } = useAuth();
  const plan    = user?.plan || 'individual';
  const limits  = LIMITS[plan] || ALL_UNLOCKED;
  const meta    = PLAN_META[plan]  || PLAN_META.individual;

  return {
    plan,
    label:           meta.label,
    color:           meta.color,
    price:           meta.price,
    reminderLimit:   limits.reminders,
    hasTeam:         limits.team,
    teamLimit:       limits.teamLimit,
    hasWhatsApp:     limits.whatsapp,
    hasMpesa:        limits.mpesa,
    hasCustomVoice:  limits.customVoice,
    hasClientPortal: limits.clientPortal,
    hasEmailSummaries: limits.emailSummaries,
    hasMeetingRecorder: limits.meetingRecorder,
    hasAnalytics:    limits.analytics,
    hasWorkflows:    limits.workflows,
    isIndividual:    plan === 'individual',
    isCorporateMini: plan === 'corporate_mini',
    isCorporate:     plan === 'corporate',
    isMajorCorporate:plan === 'major_corporate',
    isEnterprise:    plan === 'enterprise',
    canAddReminder: () => true,
    canAddMember:   () => true,
  };
}
