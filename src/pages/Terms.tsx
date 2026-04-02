import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => (
  <div className="min-h-screen bg-background px-6 py-16">
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="mb-10 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="font-display text-4xl font-light text-foreground mb-2">Terms of Service</h1>
      <p className="font-body text-sm text-muted-foreground mb-12">Last updated: April 2, 2026</p>

      <div className="space-y-10 font-body text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="font-display text-xl text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using ARIA PropGuard, you agree to be bound by these Terms of Service. If you do not agree, you may not use the service.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">2. Service Description</h2>
          <p>ARIA PropGuard provides AI-powered risk intelligence tools for prop firm traders, including trade logging, AI coaching, position calculators, and alert systems. The service is provided "as is" and does not constitute financial advice.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">3. Account & Subscription</h2>
          <p>You must provide accurate information when creating an account. Free accounts include a 7-day trial. Pro subscriptions are billed monthly at ₹1,999/mo via Razorpay. You may cancel at any time; access continues until the end of the billing period.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">4. Acceptable Use</h2>
          <p>You agree not to reverse-engineer, scrape, or misuse the service. Automated access without permission is prohibited. Each account is for a single user only.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">5. Intellectual Property</h2>
          <p>All content, design, and AI models within ARIA PropGuard are the property of ARIA PropGuard. Your trading data remains yours.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">6. Limitation of Liability</h2>
          <p>ARIA PropGuard is not responsible for trading losses. Our tools are for informational purposes only. You are solely responsible for your trading decisions and compliance with your prop firm's rules.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">7. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">8. Changes to Terms</h2>
          <p>We may update these terms periodically. Continued use of the service constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground mb-3">9. Contact</h2>
          <p>For questions about these terms, contact us at <span className="text-primary">legal@ariapropguard.com</span>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
