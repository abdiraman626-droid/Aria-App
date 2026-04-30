import LegalPage, { LSection, LSub, LP, LList, LBox } from '../components/LegalPage';

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="24 April 2026">

      <LBox color="#3b82f6">
        ARIA Life is built on trust. This policy explains what data we collect, how we use it, who we share it with, and the rights you have over your information.
      </LBox>

      <LSection title="1. Data We Collect" />
      <LP>To provide ARIA Life's features, we collect the following types of data:</LP>

      <LSub>Account Information</LSub>
      <LList items={[
        'Your name, email address, and password',
        'Profile preferences (language, voice settings, plan tier)',
        'WhatsApp phone number (optional, for reminder delivery)',
      ]} />

      <LSub>Calendar & Schedule Data</LSub>
      <LList items={[
        'Manual events you create in ARIA Life',
        'Reminders, tasks, and meeting details',
        'Google Calendar events (only when you connect your Google account)',
      ]} />

      <LSub>Voice Data</LSub>
      <LList items={[
        'Voice recordings you make in the app (used only to transcribe and respond)',
        'Meeting recordings you upload (transcribed and summarized, then deleted)',
        'Voice preferences (selected ARIA voice, ElevenLabs API key if provided)',
      ]} />

      <LSub>Email Data (Gmail Integration)</LSub>
      <LList items={[
        'When you connect Gmail, we read recent inbox messages to generate AI summaries',
        'Email content is processed and immediately discarded — never stored on our servers',
      ]} />

      <LSection title="2. How We Use Your Data" />
      <LP>
        We use your data <strong style={{ color: '#fff' }}>only to operate the features you use</strong>. Specifically:
      </LP>
      <LList items={[
        'AI processing (voice commands, email summaries, meeting transcription, strategy advice)',
        'Delivering reminders via browser notifications, email, or WhatsApp',
        'Syncing and displaying your calendar events',
        'Improving the user experience based on aggregated, anonymized usage patterns',
      ]} />
      <LBox color="#22c55e">
        <strong>We do not sell your data.</strong> We do not use your data to train AI models. We do not show you advertising based on your data.
      </LBox>

      <LSection title="3. Third-Party Services" />
      <LP>ARIA Life uses the following trusted third-party services to power specific features. Each is used only for its stated purpose, and we send the minimum data required.</LP>

      <LSub>Google (OAuth, Calendar, Gmail)</LSub>
      <LP>Used for sign-in, calendar sync, and email summaries. Subject to Google's privacy policy. Revoke access anytime at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>myaccount.google.com/permissions</a>.</LP>

      <LSub>AssemblyAI (Speech-to-Text)</LSub>
      <LP>Audio recordings are sent to AssemblyAI for transcription. Recordings are deleted from AssemblyAI immediately after transcription completes. Privacy: <a href="https://www.assemblyai.com/legal/privacy-policy" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>assemblyai.com/legal/privacy-policy</a>.</LP>

      <LSub>ElevenLabs (Text-to-Speech)</LSub>
      <LP>Text from your briefings is sent to ElevenLabs to generate the spoken voice. ElevenLabs does not retain or train on this data. Privacy: <a href="https://elevenlabs.io/privacy" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>elevenlabs.io/privacy</a>.</LP>

      <LSub>Anthropic (Claude AI)</LSub>
      <LP>Used for email summaries, meeting summaries, voice responses, and AI strategy advice. Anthropic does not retain or train on customer data submitted via API. Privacy: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>anthropic.com/privacy</a>.</LP>

      <LSection title="4. Data Storage & Security" />
      <LList items={[
        'Your data is stored securely in Google Firebase (encrypted at rest and in transit)',
        'Authentication uses industry-standard OAuth 2.0 and bcrypt-hashed passwords',
        'Voice recordings are stored temporarily during transcription and then permanently deleted',
        'API keys (ElevenLabs, etc.) you provide are stored locally in your browser, never on our servers',
      ]} />

      <LSection title="5. Your Rights" />
      <LP>You have full control over your data:</LP>

      <LSub>Export Your Data</LSub>
      <LP>Email <a href="mailto:arialifesupport@gmail.com" style={{ color: '#3b82f6' }}>arialifesupport@gmail.com</a> with the subject "Data Export" and we'll send you a complete JSON file of your account data within 7 business days.</LP>

      <LSub>Delete Your Account</LSub>
      <LP>You can delete your account anytime from Settings → Sign Out → "Delete Account", or by emailing <a href="mailto:arialifesupport@gmail.com" style={{ color: '#3b82f6' }}>arialifesupport@gmail.com</a>. All your data is permanently removed within 30 days.</LP>

      <LSub>Other Rights</LSub>
      <LList items={[
        'Access — request a copy of your data',
        'Correction — fix inaccurate information',
        'Deletion — remove all your data',
        'Portability — receive your data in a machine-readable format',
        'Objection — opt out of any optional data processing',
      ]} />

      <LSection title="6. Children's Privacy" />
      <LP>
        ARIA Life is not intended for users under 18. We do not knowingly collect data from minors. If we learn we have inadvertently collected data from a minor, we delete it immediately.
      </LP>

      <LSection title="7. Changes to This Policy" />
      <LP>
        We may update this Privacy Policy from time to time. Material changes will be communicated via email and an in-app notice 30 days before they take effect. The "Last updated" date at the top of this page reflects the most recent revision.
      </LP>

      <LSection title="8. Contact" />
      <LP>
        Questions, concerns, or requests about your data? Email us at <a href="mailto:arialifesupport@gmail.com" style={{ color: '#3b82f6' }}>arialifesupport@gmail.com</a>. We respond within 5 business days.
      </LP>

    </LegalPage>
  );
}
