import { useAuth } from '../context/AuthContext';

const LIMITS = {
  individual:      { reminders: Infinity, team: false, teamLimit: 3,        mpesa: false, customVoice: false, clientPortal: false, emailSummaries: false, meetingRecorder: false, analytics: false, workflows: false },
  corporate_mini:  { reminders: Infinity, team: true,  teamLimit: 10,       mpesa: false, customVoice: false, clientPortal: true,  emailSummaries: true,  meetingRecorder: false, analytics: false, workflows: false },
  corporate:       { reminders: Infinity, team: true,  teamLimit: 50,       mpesa: true,  customVoice: true,  clientPortal: true,  emailSummaries: true,  meetingRecorder: true,  analytics: false, workflows: false },
  major_corporate: { reminders: Infinity, team: true,  teamLimit: 500,      mpesa: true,  customVoice: true,  clientPortal: true,  emailSummaries: true,  meetingRecorder: true,  analytics: true,  workflows: false },
  enterprise:      { reminders: Infinity, team: true,  teamLimit: Infinity, mpesa: true,  customVoice: true,  clientPortal: true,  emailSummaries: true,  meetingRecorder: true,  analytics: true,  workflows: true  },
};

export function usePlan() {
  const { user, PLAN_META } = useAuth();
  const plan    = user?.plan || 'individual';
  const limits  = LIMITS[plan] || LIMITS.individual;
  const meta    = PLAN_META[plan]  || PLAN_META.individual;

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
    hasEmailSummaries: limits.emailSummaries,
    hasMeetingRecorder: limits.meetingRecorder,
    hasAnalytics:    limits.analytics,
    hasWorkflows:    limits.workflows,
    isIndividual:    plan === 'individual',
    isCorporateMini: plan === 'corporate_mini',
    isCorporate:     plan === 'corporate',
    isMajorCorporate:plan === 'major_corporate',
    isEnterprise:    plan === 'enterprise',
    canAddReminder: (currentCount) =>
      limits.reminders === Infinity || currentCount < limits.reminders,
    canAddMember: (currentCount) =>
      limits.teamLimit === Infinity || currentCount < limits.teamLimit,
  };
}
