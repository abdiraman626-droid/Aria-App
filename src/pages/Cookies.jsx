import LegalPage, { LSection, LSub, LP, LList, LBox } from '../components/LegalPage';

export default function Cookies() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="25 March 2026">

      <LBox color="#4F6EF7">
        ARIA uses a minimal set of cookies and local storage — only what is strictly necessary to keep you signed in and remember your preferences. We do not use advertising cookies or third-party tracking.
      </LBox>

      <LSection title="1. What Are Cookies?" />
      <LP>
        Cookies are small text files stored by your browser when you visit a website. ARIA also uses <strong style={{ color: '#fff' }}>localStorage</strong> and <strong style={{ color: '#fff' }}>sessionStorage</strong> — browser storage mechanisms that work similarly to cookies but are not transmitted to the server on every request.
      </LP>

      <LSection title="2. Cookies & Storage ARIA Uses" />

      <LSub>2.1 Authentication (Essential)</LSub>
      <LList items={[
        'Name: sb-* (Supabase session cookies)',
        'Purpose: Keep you signed in to your ARIA account',
        'Duration: Session — cleared when you sign out or your session expires (default 1 hour)',
        'Can you opt out? No — these are required for the app to function. Blocking them will prevent sign-in.',
      ]} />

      <LSub>2.2 Preferences (localStorage)</LSub>
      <LList items={[
        'Key: aria_voice_id — stores your chosen ElevenLabs voice preference',
        'Key: aria_el_key — stores a custom ElevenLabs API key if you provide one',
        'Key: aria_lang — stores your language preference (English or Swahili)',
        'Duration: Persistent (until you clear browser data or change the setting)',
        'Can you opt out? Yes — clearing localStorage in your browser will reset these to defaults.',
      ]} />

      <LSub>2.3 Rate Limiting (localStorage)</LSub>
      <LList items={[
        'Key: rl_attempts_* — tracks failed login attempts to prevent brute-force attacks',
        'Key: rl_locked_* — records lockout timestamp after 5 failed attempts',
        'Duration: Up to 15 minutes, then cleared automatically',
        'Can you opt out? No — this is a security measure. Clearing it manually will reset your lockout counter.',
      ]} />

      <LSub>2.4 Onboarding (localStorage)</LSub>
      <LList items={[
        'Key: aria_welcome_shown — records whether you have seen the welcome banner after completing the tour',
        'Duration: Persistent',
        'Can you opt out? Yes — clearing localStorage removes this flag and the banner may re-appear.',
      ]} />

      <LSub>2.5 Notification Deduplication (sessionStorage)</LSub>
      <LList items={[
        'Key: urgent_* — prevents URGENT reminder notifications from firing more than once every 30 minutes',
        'Duration: Session only — cleared when you close the browser tab',
        'Can you opt out? No — this prevents notification spam.',
      ]} />

      <LSection title="3. What We Do NOT Use" />
      <LBox color="#22c55e">
        ARIA does <strong>not</strong> use any of the following:
      </LBox>
      <LList items={[
        'Google Analytics or any analytics tracking cookies',
        'Facebook Pixel or any social media tracking',
        'Advertising or retargeting cookies',
        'Third-party session recording tools (e.g. Hotjar, FullStory)',
        'Cross-site tracking cookies of any kind',
      ]} />

      <LSection title="4. Third-Party Cookies" />
      <LP>
        When you use Google OAuth to connect your Google account, Google may set its own cookies for the authentication flow. These cookies are governed by Google's Privacy Policy and are cleared once the OAuth handshake is complete. ARIA does not control or have access to Google's cookies.
      </LP>

      <LSection title="5. How to Manage Cookies" />

      <LSub>Clearing cookies and localStorage</LSub>
      <LP>You can clear all ARIA cookies and stored data at any time:</LP>
      <LList items={[
        'Chrome: Settings → Privacy and Security → Clear browsing data → Cookies and Cached files',
        'Safari: Settings → Safari → Clear History and Website Data',
        'Firefox: Settings → Privacy & Security → Cookies and Site Data → Clear Data',
        'Edge: Settings → Privacy, search, and services → Clear browsing data',
      ]} />
      <LP>
        Note: Clearing cookies will sign you out of ARIA and reset your preferences.
      </LP>

      <LSub>Browser "Do Not Track"</LSub>
      <LP>
        ARIA respects the Do Not Track (DNT) signal. Since we do not use tracking or analytics cookies regardless of DNT status, there is no behavioural difference in our data practices when DNT is enabled.
      </LP>

      <LSection title="6. Changes to This Policy" />
      <LP>
        If we ever introduce new types of cookies (e.g. analytics to improve the product), we will update this policy and notify you in the app before any new cookies are set.
      </LP>

      <LSection title="7. Contact" />
      <LP>
        Questions about our cookie practices? Email{' '}
        <a href="mailto:support@ariaassistant.co.ke" style={{ color: 'var(--blue)' }}>support@ariaassistant.co.ke</a>.
        <br />
        ARIA Assistant Ltd. · Nairobi, Kenya
      </LP>

    </LegalPage>
  );
}
