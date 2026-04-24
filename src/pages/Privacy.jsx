import LegalPage, { LSection, LSub, LP, LList, LBox } from '../components/LegalPage';

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="25 March 2026">

      <LBox color="#3b82f6">
        We built ARIA for business professionals who trust us with their schedules, contacts, and communications. We take that trust seriously. This policy explains exactly what data we collect, why we collect it, and how you can control it.
      </LBox>

      <LSection title="1. Who We Are" />
      <LP>
        ARIA Life is a product of ARIA Life Inc., a company registered in San Francisco, CA. References to "ARIA", "we", "us", or "our" in this policy refer to ARIA Life Inc.
      </LP>
      <LP>
        Contact: <a href="mailto:support@arialife.app" style={{ color: 'var(--blue)' }}>support@arialife.app</a>
      </LP>

      <LSection title="2. Data We Collect" />

      <LSub>2.1 Account Data</LSub>
      <LP>When you create an account, we collect:</LP>
      <LList items={[
        'Full name',
        'Email address',
        'WhatsApp phone number (optional)',
        'Chosen subscription plan',
        'Account creation date and login timestamps',
      ]} />

      <LSub>2.2 Reminder & Schedule Data</LSub>
      <LP>The core of ARIA is your reminders. We store:</LP>
      <LList items={[
        'Reminder title, description, date, and time',
        'Reminder type (personal, team, client)',
        'Delivery preferences (voice, WhatsApp, notification)',
        'M-Pesa payment details you attach to reminders (amount and till/paybill number — never card or PIN data)',
        'Completion and confirmation status',
      ]} />

      <LSub>2.3 Google Calendar & Gmail Data</LSub>
      <LP>
        When you connect your Google account, ARIA requests read-only access to your Google Calendar and Gmail. We use this data solely to:
      </LP>
      <LList items={[
        'Surface your upcoming meetings in your morning voice briefing',
        'Identify urgent emails and include them in your daily summary',
      ]} />
      <LP>
        We do not store Google Calendar events or Gmail message content in our database. Calendar and email data is fetched at briefing time, used to generate your briefing, and not retained beyond that request. You can disconnect Google at any time from Settings → Integrations.
      </LP>

      <LSub>2.4 Voice & Audio Data</LSub>
      <LP>
        ARIA generates spoken briefings using ElevenLabs text-to-speech. We send your briefing text (reminder titles, schedule, names) to ElevenLabs to synthesise audio. We do not send raw audio recordings of your voice to any service. ElevenLabs processes this data under their own privacy policy.
      </LP>

      <LSub>2.5 Team & Client Data</LSub>
      <LP>Business and Premium users may store:</LP>
      <LList items={[
        'Team member names and email addresses (for invites)',
        'Client names, phone numbers, and email addresses',
        'Client portal tokens (anonymised links — contain no personal data in the URL)',
      ]} />

      <LSub>2.6 Usage & Technical Data</LSub>
      <LP>We collect limited technical data to keep the service running:</LP>
      <LList items={[
        'Browser type and operating system (from your user-agent)',
        'Pages visited within the app and feature usage events',
        'Error logs (no personal content included)',
        'IP address (for security and fraud prevention)',
      ]} />

      <LSection title="3. How We Store Your Data" />
      <LP>
        All user data is stored in <strong style={{ color: '#fff' }}>Supabase</strong>, a Postgres database platform. Supabase encrypts data at rest (AES-256) and in transit (TLS 1.2+). Our database is hosted in the EU (Frankfurt) region.
      </LP>
      <LP>
        Row Level Security (RLS) is enforced on every table: your data is accessible only to your authenticated session. No other user can read your reminders, team members, or client data — even if they know your user ID.
      </LP>
      <LBox color="#22c55e">
        We never sell your data. We never use your data to train AI models. Your reminders and contacts belong to you.
      </LBox>

      <LSection title="4. How We Use Your Data" />
      <LList items={[
        'To deliver your morning voice briefings and WhatsApp reminders',
        'To send reminder notifications (browser push, WhatsApp via WasenderAPI)',
        'To display your schedule, team, and client information within the app',
        'To process subscription payments (plan upgrades/downgrades)',
        'To respond to support requests',
        'To detect and prevent fraudulent or abusive use of the platform',
        'To send transactional emails (account confirmation, password reset) — never marketing emails without your consent',
      ]} />

      <LSection title="5. Third-Party Services" />
      <LP>ARIA integrates with the following third-party services. Each service processes data under its own privacy policy:</LP>

      <LSub>Google (Calendar & Gmail)</LSub>
      <LList items={[
        'Purpose: Read your calendar events and Gmail for daily briefings',
        'Data shared: Google OAuth token (stored encrypted); event titles and email subjects fetched on demand',
        'Policy: policies.google.com/privacy',
      ]} />

      <LSub>ElevenLabs (Voice Synthesis)</LSub>
      <LList items={[
        'Purpose: Convert your briefing text to spoken audio',
        'Data shared: Briefing text (reminder titles, schedule summary)',
        'Policy: elevenlabs.io/privacy',
      ]} />

      <LSub>WasenderAPI (WhatsApp Delivery)</LSub>
      <LList items={[
        'Purpose: Deliver reminders to your WhatsApp number',
        'Data shared: Your WhatsApp number and reminder message text',
        'Policy: Contact WasenderAPI for their privacy terms',
      ]} />

      <LSub>Stripe (Payments)</LSub>
      <LList items={[
        'Purpose: Process monthly subscription payments',
        'Data shared: Phone number and payment amount; ARIA does not store M-Pesa PINs or card numbers',
        'Policy: stripe.com/privacy',
      ]} />

      <LSub>Vercel (Hosting)</LSub>
      <LList items={[
        'Purpose: Hosting and serving the ARIA web application',
        'Data shared: Request logs (IP, user-agent)',
        'Policy: vercel.com/legal/privacy-policy',
      ]} />

      <LSection title="6. Data Retention" />
      <LP>We retain your data for as long as your account is active. If you delete your account:</LP>
      <LList items={[
        'All reminders, team data, and client data are deleted within 30 days',
        'Account metadata (email, plan history) is retained for 90 days for fraud prevention, then permanently deleted',
        'Backup snapshots are purged within 180 days',
      ]} />

      <LSection title="7. Your Rights" />
      <LP>You have the following rights over your data:</LP>
      <LList items={[
        'Access: Request a copy of all data we hold about you',
        'Correction: Update your name, phone number, or email from Settings',
        'Deletion: Delete your account from Settings → Account, or email us at support@arialife.app',
        'Export: Request a JSON export of your reminders and profile data',
        'Disconnect Google: Revoke Google access from Settings → Integrations at any time',
        'Opt out of WhatsApp messages: Remove your number from Settings → Notifications',
      ]} />
      <LP>
        To exercise any of these rights, email <a href="mailto:support@arialife.app" style={{ color: 'var(--blue)' }}>support@arialife.app</a>. We respond within 5 business days.
      </LP>

      <LSection title="8. Children's Privacy" />
      <LP>
        ARIA is intended for business professionals aged 18 and above. We do not knowingly collect data from anyone under 18. If you believe a minor has created an account, please contact us immediately.
      </LP>

      <LSection title="9. Changes to This Policy" />
      <LP>
        We may update this policy as ARIA grows. For material changes, we will notify you by email and show a banner in the app at least 14 days before the change takes effect. The "Last updated" date at the top of this page always reflects the current version.
      </LP>

      <LSection title="10. Contact" />
      <LP>
        Questions about this privacy policy? Email us at{' '}
        <a href="mailto:support@arialife.app" style={{ color: 'var(--blue)' }}>support@arialife.app</a>.
        <br />
        ARIA Life Inc. · San Francisco, CA
      </LP>

    </LegalPage>
  );
}
