export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: May 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
          <p className="text-slate-400 leading-relaxed">
            AI Email Client ("the App") is a personal productivity tool that connects to your email
            accounts to help you read, send, and manage emails using AI-powered features. We are
            committed to protecting your privacy and handling your data responsibly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Data We Access</h2>
          <p className="text-slate-400 leading-relaxed mb-3">
            When you connect a Gmail or Office 365 account, we request access to:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
            <li>Read your emails (to display them in the app)</li>
            <li>Send emails on your behalf (when you compose and send)</li>
            <li>Modify emails (to archive, delete, or mark as read)</li>
            <li>Your email address (to identify your account)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
            <li>Email content is used solely to display your inbox and power AI features (summarisation, draft replies, priority scoring)</li>
            <li>AI features send email subject and body text to the Anthropic API for processing</li>
            <li>We do not sell, share, or use your data for advertising</li>
            <li>We do not store email content permanently — it is fetched on demand and held in memory only</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage</h2>
          <p className="text-slate-400 leading-relaxed">
            We store only your account identifier, email address, and OAuth tokens in a secure
            database. These are used to authenticate requests to your email provider on your behalf.
            OAuth tokens are encrypted in transit and stored securely. You can remove your account
            at any time from within the app, which deletes all stored tokens.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Third-Party Services</h2>
          <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
            <li><strong className="text-slate-300">Google OAuth</strong> — used to authenticate Gmail accounts</li>
            <li><strong className="text-slate-300">Microsoft OAuth</strong> — used to authenticate Office 365 accounts</li>
            <li><strong className="text-slate-300">Anthropic API</strong> — used to power AI summarisation, draft replies, and email prioritisation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
          <p className="text-slate-400 leading-relaxed">
            You can disconnect your email account at any time from within the app. This immediately
            removes your OAuth tokens from our database. You can also revoke access directly from
            your Google or Microsoft account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
          <p className="text-slate-400 leading-relaxed">
            If you have any questions about this privacy policy or how your data is handled, please
            contact us at{' '}
            <a href="mailto:singh.pankhil77@gmail.com" className="text-indigo-400 hover:underline">
              singh.pankhil77@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
