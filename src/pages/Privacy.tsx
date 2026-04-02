import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => (
  <div className="min-h-screen bg-background px-6 py-16">
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="mb-10 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="font-display text-4xl font-light text-foreground mb-2">Privacy Policy</h1>
      <p className="font-body text-sm text-muted-foreground mb-12">Last updated: April 2, 2026</p>

      <div className="space-y-10 font-body text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="font-display text-xl text-foreground mb-3">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your email address, trading data, and account preferences. We also collect usage data such as pages visited, features used, and interaction patterns to improve our service.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">2. How We Use Your Information</h2>
          <p>Your information is used to provide and maintain the ARIA PropGuard service, including AI-powered trade analysis, risk monitoring, and alert delivery. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">3. Data Storage & Security</h2>
          <p>Your data is stored securely using industry-standard encryption. Trading data and account information are protected with row-level security policies ensuring only you can access your own data.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">4. Third-Party Services</h2>
          <p>We use Razorpay for payment processing. Your payment information is handled directly by Razorpay and is not stored on our servers. We may use analytics services to understand usage patterns.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">5. Cookies & Tracking</h2>
          <p>We use essential cookies for authentication and session management. No third-party advertising cookies are used.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can export your trading data from the dashboard.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">7. Contact</h2>
          <p>For privacy-related inquiries, contact us at <span className="text-primary">privacy@ariapropguard.com</span>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
