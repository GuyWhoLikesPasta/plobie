'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [conductConfirmed, setConductConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ageConfirmed || !conductConfirmed) {
      setError('Please confirm you are 13+ and agree to our community guidelines');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      trackEvent('user_signup', 'email');
      router.push('/');
      router.refresh();
    }
  };

  const handleGoogleSignup = async () => {
    if (!ageConfirmed || !conductConfirmed) {
      setError('Please confirm you are 13+ and agree to our community guidelines');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    if (!ageConfirmed || !conductConfirmed) {
      setError('Please confirm you are 13+ and agree to our community guidelines');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-cyan-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-black mb-3">
            <span className="text-5xl">🌱</span> <span className="gradient-text">Plobie</span>
          </h1>
          <h2 className="text-3xl font-black text-white mb-3">Join Our Community</h2>
          <p className="text-gray-400 text-lg">Start your plant journey today</p>
        </div>

        <div className="glass-strong rounded-3xl shadow-2xl p-10 border border-white/10">
          {error && (
            <div className="mb-6 p-4 glass border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 glass text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500 border-none font-medium"
                placeholder="plantlover123"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 glass text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500 border-none font-medium"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 glass text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500 border-none font-medium"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">At least 6 characters</p>
            </div>

            <div className="space-y-4 pt-4">
              <label className="flex items-start gap-3 cursor-pointer group p-3 glass rounded-xl hover:bg-white/5 transition-all">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded accent-emerald-500 cursor-pointer focus:ring-2 focus:ring-emerald-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I confirm that I am at least 13 years old
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group p-3 glass rounded-xl hover:bg-white/5 transition-all">
                <input
                  type="checkbox"
                  checked={conductConfirmed}
                  onChange={(e) => setConductConfirmed(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded accent-emerald-500 cursor-pointer focus:ring-2 focus:ring-emerald-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I agree to communicate respectfully and follow Plobie's community guidelines
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !ageConfirmed || !conductConfirmed}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating account...' : 'Sign Up →'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 glass text-gray-400 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleSignup}
                disabled={loading || !ageConfirmed || !conductConfirmed}
                className="flex items-center justify-center px-4 py-3 glass border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-bold text-white">Google</span>
              </button>

              <button
                onClick={handleAppleSignup}
                disabled={loading || !ageConfirmed || !conductConfirmed}
                className="flex items-center justify-center px-4 py-3 glass border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5 mr-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span className="text-sm font-bold text-white">Apple</span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

