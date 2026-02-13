import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Plobie privacy policy — how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-stone-900 dark:text-white tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-10">Last updated: January 22, 2026</p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              1. Information We Collect
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              When you create an account on Plobie, we collect your email address, username, and any
              profile information you choose to provide. We also collect usage data such as pages
              visited, features used, and XP earned to improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              2. How We Use Your Information
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              We use your information to provide and improve the Plobie platform, including managing
              your account, processing purchases, tracking your plant care progress and XP, and
              communicating with you about your account or our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              3. Data Storage & Security
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              Your data is stored securely using Supabase with row-level security policies.
              Passwords are handled by our authentication provider and are never stored in plain
              text. We use HTTPS encryption for all data in transit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              4. Third-Party Services
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              We use the following third-party services: Supabase for authentication and data
              storage, Stripe for payment processing, Vercel for hosting and analytics, and Sentry
              for error monitoring. Each service has its own privacy policy governing data they
              process.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              5. Cookies
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              We use essential cookies to maintain your authentication session and theme preference.
              We use Vercel Analytics for anonymous usage statistics. We do not use third-party
              advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              6. Your Rights
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              You may access, update, or delete your account and personal data at any time through
              your account settings. If you wish to request a full data export or have your data
              completely removed, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              7. Changes to This Policy
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of significant
              changes by posting a notice on our platform or by sending you an email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              8. Contact
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              If you have questions about this privacy policy, please reach out to us through our
              community channels or at the contact information provided on our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
