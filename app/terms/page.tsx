import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Plobie terms of service — rules and guidelines for using our platform.',
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-10">Last updated: January 22, 2026</p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              1. Acceptance of Terms
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              By creating an account or using Plobie, you agree to these Terms of Service and our
              Privacy Policy. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              2. Account Responsibility
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              You are responsible for maintaining the security of your account credentials. You must
              provide accurate information when creating your account. You may not impersonate
              others or create accounts for malicious purposes. One account per person is permitted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              3. Community Guidelines
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              Plobie is a community for plant enthusiasts. Be respectful to other members. Do not
              post content that is harmful, harassing, hateful, sexually explicit, or otherwise
              inappropriate. We reserve the right to remove content and suspend accounts that
              violate these guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              4. XP & Achievements
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              Experience Points (XP) and achievements are digital rewards within the Plobie
              platform. They have no monetary value and cannot be exchanged for cash. We reserve the
              right to modify XP values, daily caps, and achievement requirements. Any attempt to
              exploit or manipulate the XP system may result in account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              5. Purchases & Shop
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              All purchases made through the Plobie shop are processed by Stripe. Prices are
              displayed in USD unless otherwise noted. We aim to ship orders within the timeframe
              stated at checkout. Refund and return policies are provided at the time of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              6. Gift Cards
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              Gift cards are valid for one year from the date of purchase. They are non-refundable
              and cannot be exchanged for cash. Gift card balances can be applied to any purchase on
              Plobie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              7. Intellectual Property
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              All content, design, and code on Plobie is the property of Plobie or its licensors.
              Content you post remains yours, but you grant Plobie a non-exclusive license to
              display it on the platform. You may not copy, modify, or distribute Plobie&apos;s
              proprietary content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              8. Limitation of Liability
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              Plobie is provided &quot;as is&quot; without warranty of any kind. We are not liable
              for any indirect, incidental, or consequential damages arising from your use of the
              platform. Our total liability is limited to the amount you have paid to us in the
              preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              9. Changes to Terms
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              We may update these terms from time to time. Continued use of Plobie after changes
              constitutes acceptance of the updated terms. We will provide notice of significant
              changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              10. Contact
            </h2>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              If you have questions about these terms, please reach out through our community
              channels or at the contact information provided on our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
