'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GIFT_CARD_OPTIONS = [
  { price_cents: 1000, value_cents: 1500, label: '$10', value_label: '$15', bonus: '50% bonus' },
  {
    price_cents: 2000,
    value_cents: 4500,
    label: '$20',
    value_label: '$45',
    bonus: '125% bonus',
    featured: true,
    promo: "Mother's Day Special!",
  },
  { price_cents: 5000, value_cents: 7500, label: '$50', value_label: '$75', bonus: '50% bonus' },
  {
    price_cents: 10000,
    value_cents: 15000,
    label: '$100',
    value_label: '$150',
    bonus: '50% bonus',
  },
];

export default function GiftCardsPage() {
  const [selectedOption, setSelectedOption] = useState(GIFT_CARD_OPTIONS[1]); // Default to featured
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const router = useRouter();

  const handlePurchase = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_cents: selectedOption.price_cents,
          recipient_email: recipientEmail || undefined,
          recipient_name: recipientName || undefined,
          sender_name: senderName || undefined,
          personal_message: personalMessage || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error?.message || 'Failed to create checkout');
        setLoading(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;

    setRedeemLoading(true);
    setRedeemResult(null);

    try {
      const response = await fetch('/api/gift-cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode }),
      });

      const data = await response.json();

      if (data.success) {
        setRedeemResult({
          success: true,
          message: `Gift card added! Balance: $${(data.data.balance_cents / 100).toFixed(2)}`,
        });
        setRedeemCode('');
      } else {
        setRedeemResult({ success: false, message: data.error?.message || 'Invalid gift card' });
      }
    } catch (err) {
      setRedeemResult({ success: false, message: 'Something went wrong' });
    }

    setRedeemLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
            Plobie Gift Cards
          </h1>
          <p className="text-xl text-stone-600 dark:text-stone-400 mb-2">
            Give the gift of plants to someone special
          </p>
          <div className="inline-block bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 px-4 py-2 rounded-xl text-sm font-medium">
            Special Offer: Spend $20, Get $45 Value
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Purchase Section */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-8 border border-stone-200 dark:border-stone-700">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6 tracking-tight">
              Buy a Gift Card
            </h2>

            {/* Amount Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {GIFT_CARD_OPTIONS.map(option => (
                <button
                  key={option.price_cents}
                  onClick={() => setSelectedOption(option)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedOption.price_cents === option.price_cents
                      ? 'border-green-600 bg-stone-50 dark:bg-stone-700/50'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-400'
                  }`}
                >
                  {option.featured && (
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-lg">
                      Best Deal
                    </span>
                  )}
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-green-600 dark:text-green-400 font-medium">
                    Get {option.value_label} value
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">{option.bonus}</div>
                </button>
              ))}
            </div>

            {/* Recipient Details */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Recipient&apos;s Name (optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Enter their name"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Recipient&apos;s Email (optional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="We'll send the gift card to them"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="So they know who it's from"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Personal Message (optional)
                </label>
                <textarea
                  value={personalMessage}
                  onChange={e => setPersonalMessage(e.target.value)}
                  placeholder="Add a heartfelt message..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-stone-400 text-white font-semibold rounded-xl transition text-lg"
            >
              {loading ? 'Processing...' : `Buy ${selectedOption.label} Gift Card`}
            </button>

            <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">
              You&apos;ll pay {selectedOption.label} and they&apos;ll get{' '}
              {selectedOption.value_label} to spend!
            </p>
          </div>

          {/* Redeem Section */}
          <div>
            <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-8 mb-8 border border-stone-200 dark:border-stone-700">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6 tracking-tight">
                Have a Gift Card?
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-4">
                Enter your gift card code to add the balance to your account
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white font-mono text-lg tracking-wider"
                />
                <button
                  onClick={handleRedeem}
                  disabled={redeemLoading || !redeemCode.trim()}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl disabled:bg-stone-400 transition"
                >
                  {redeemLoading ? '...' : 'Redeem'}
                </button>
              </div>

              {redeemResult && (
                <div
                  className={`mt-4 p-3 rounded-xl text-sm ${
                    redeemResult.success
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {redeemResult.message}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl p-8 border border-stone-200 dark:border-stone-700">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4 tracking-tight">
                How Gift Cards Work
              </h3>
              <ul className="space-y-3 text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">·</span>
                  Never expires (valid for 1 year from purchase)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">·</span>
                  Works on all Plobie products
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">·</span>
                  Can be used in multiple purchases
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">·</span>
                  Instant delivery via email
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Shop */}
        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="text-green-600 dark:text-green-400 hover:underline font-medium"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
