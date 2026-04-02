import LegalPage, { LSection, LSub, LP, LList, LBox } from '../components/LegalPage';

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="25 March 2026">

      <LBox color="#8B5CF6">
        Please read these terms carefully before using ARIA. By creating an account or using the service, you agree to be bound by these terms.
      </LBox>

      <LSection title="1. What ARIA Is" />
      <LP>
        ARIA ("the Service") is an AI-powered business assistant that delivers morning voice briefings, manages reminders, syncs with Google Calendar and Gmail, and sends notifications via WhatsApp. ARIA is offered as a monthly subscription software-as-a-service (SaaS) product.
      </LP>
      <LP>
        ARIA Assistant Ltd. ("Company", "we", "us") is registered in Nairobi, Kenya. These Terms of Service ("Terms") govern your use of ARIA and form a binding agreement between you and the Company.
      </LP>

      <LSection title="2. Eligibility" />
      <LP>You may use ARIA if:</LP>
      <LList items={[
        'You are at least 18 years old',
        'You are using ARIA for lawful business or personal productivity purposes',
        'You have the authority to accept these Terms on behalf of any organisation you represent',
        'Your use complies with all applicable Kenyan and international laws',
      ]} />

      <LSection title="3. Account Responsibilities" />
      <LP>As a registered user, you agree to:</LP>
      <LList items={[
        'Provide accurate, complete, and current information when creating your account',
        'Keep your password secure and not share your account credentials with others',
        'Notify us immediately at support@ariaassistant.co.ke if you suspect unauthorised access to your account',
        'Use ARIA only for its intended purpose — managing your personal or business schedule and communications',
        'Not attempt to reverse-engineer, scrape, or exploit any part of the ARIA platform',
        'Not upload or submit any content that is illegal, defamatory, or violates the rights of others',
        'Not use ARIA to spam, harass, or send unsolicited messages to others',
      ]} />

      <LSection title="4. Subscription Plans & Pricing" />
      <LSub>4.1 Plans</LSub>
      <LP>ARIA is offered on three subscription tiers:</LP>
      <LList items={[
        'Personal — KES 99/month — 1 user, 20 reminders/month, voice briefings, Gmail & Calendar sync',
        'Business — KES 299/month — 5 users, unlimited reminders, team management, priority support',
        'Premium — KES 500/month — Unlimited users, custom AI voice, M-Pesa integration, dedicated account manager',
      ]} />

      <LSub>4.2 Free Trial</LSub>
      <LP>
        All plans include a <strong style={{ color: '#fff' }}>7-day free trial</strong>. No credit card or M-Pesa payment is required to start your trial. At the end of the trial period, your account will transition to a paid subscription if you choose to continue.
      </LP>

      <LSub>4.3 Billing</LSub>
      <LP>
        Subscriptions are billed monthly. Payment is collected via M-Pesa or other accepted payment methods at the start of each billing cycle. Prices are listed in Kenyan Shillings (KES) and are inclusive of any applicable taxes.
      </LP>
      <LP>
        We reserve the right to change subscription prices with 30 days notice. Price changes will be communicated by email and in-app notification before they take effect.
      </LP>

      <LSub>4.4 Refund Policy</LSub>
      <LBox color="#ef4444">
        We offer a 7-day free trial on all plans so you can evaluate ARIA before paying. After the trial period ends and a payment has been processed, <strong>we do not issue refunds</strong> for the current billing period. If you cancel, your access continues until the end of the paid period.
      </LBox>
      <LP>
        Exceptions: If you experience a technical failure that prevents you from using the service for more than 72 consecutive hours due to our fault, you may be eligible for a prorated credit. Contact support@ariaassistant.co.ke within 14 days of the incident.
      </LP>

      <LSub>4.5 Cancellation</LSub>
      <LP>
        You may cancel your subscription at any time from Settings → Account. Cancellation takes effect at the end of the current billing period. You will retain full access until then. We do not charge cancellation fees.
      </LP>

      <LSection title="5. Account Termination" />
      <LSub>5.1 By You</LSub>
      <LP>
        You may delete your account at any time from Settings → Account → Delete Account. Account deletion is permanent. See our Privacy Policy for details on data retention after deletion.
      </LP>

      <LSub>5.2 By Us</LSub>
      <LP>We may suspend or terminate your account immediately if:</LP>
      <LList items={[
        'You breach any provision of these Terms',
        'You engage in fraudulent, abusive, or illegal activity',
        'Payment fails and is not resolved within 14 days of our notice',
        'Continued access poses a security risk to other users or our systems',
      ]} />
      <LP>
        Where reasonable, we will give you advance notice before termination. In cases of fraud or security breach, we may act immediately without notice.
      </LP>

      <LSection title="6. Intellectual Property" />
      <LP>
        ARIA and all its content, features, and functionality — including the software, voice models, UI design, and branding — are owned by ARIA Assistant Ltd. and protected by Kenyan and international intellectual property law.
      </LP>
      <LP>
        Your subscription grants you a limited, non-exclusive, non-transferable licence to use the Service for your own business or personal purposes. You may not copy, modify, distribute, sell, or lease any part of ARIA.
      </LP>
      <LP>
        Content you create within ARIA (reminders, notes, client names) remains your property. By storing it in ARIA, you grant us a limited licence to process and display it within the Service.
      </LP>

      <LSection title="7. Third-Party Services" />
      <LP>
        ARIA integrates with Google, ElevenLabs, WasenderAPI, and M-Pesa/Safaricom. Your use of those integrations is also governed by the respective third parties' terms of service. We are not responsible for disruptions, changes, or failures in third-party services.
      </LP>

      <LSection title="8. Availability & Service Levels" />
      <LP>
        We aim for high availability but do not guarantee uninterrupted access to ARIA. We may perform scheduled maintenance (which we will communicate in advance) or experience unplanned downtime. We are not liable for losses caused by service unavailability.
      </LP>

      <LSection title="9. Limitation of Liability" />
      <LBox color="#f59e0b">
        To the maximum extent permitted by Kenyan law, ARIA Assistant Ltd. shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including but not limited to loss of profits, data, business opportunities, or reputation — arising from your use of or inability to use the Service.
      </LBox>
      <LP>
        Our total cumulative liability to you for any claims under these Terms shall not exceed the amount you paid us in the 3 months prior to the claim arising.
      </LP>
      <LP>
        ARIA is a productivity tool. We are not liable for missed meetings, deadlines, payments, or business decisions made in reliance on ARIA's reminders or briefings.
      </LP>

      <LSection title="10. Disclaimer of Warranties" />
      <LP>
        ARIA is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Service will be error-free, secure, or meet your specific requirements. Use of ARIA is at your own risk.
      </LP>

      <LSection title="11. Governing Law & Disputes" />
      <LP>
        These Terms are governed by the laws of the Republic of Kenya. Any disputes arising from these Terms or your use of ARIA shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be subject to the jurisdiction of the courts of Nairobi, Kenya.
      </LP>

      <LSection title="12. Changes to These Terms" />
      <LP>
        We may update these Terms from time to time. For material changes, we will notify you by email and display a notice in the app at least 14 days before the new terms take effect. Continued use of ARIA after the effective date constitutes your acceptance of the updated Terms.
      </LP>

      <LSection title="13. Contact" />
      <LP>
        Questions about these Terms? Email{' '}
        <a href="mailto:support@ariaassistant.co.ke" style={{ color: 'var(--blue)' }}>support@ariaassistant.co.ke</a>.
        <br />
        ARIA Assistant Ltd. · Nairobi, Kenya
      </LP>

    </LegalPage>
  );
}
