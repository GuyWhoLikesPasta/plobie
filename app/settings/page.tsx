'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

type Tab = 'account' | 'preferences' | 'notifications';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [xpNotifications, setXpNotifications] = useState(true);
  const [communityNotifications, setCommunityNotifications] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/settings');
      return;
    }

    setUser(user);

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (prof) {
      setProfile(prof);
      setDisplayName(prof.display_name || '');
      setBio(prof.bio || '');
      setUsername(prof.username || '');
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          bio: bio || null,
          username: username || profile?.username,
        })
        .eq('id', user!.id);

      if (error) throw error;
      showMessage('success', 'Profile updated successfully');
      loadProfile();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showMessage('success', 'Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Image must be under 2MB');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profiles/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      showMessage('success', 'Avatar updated');
      loadProfile();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-8 tracking-tight">
          Settings
        </h1>

        {/* Message banner */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-stone-200 dark:bg-stone-800 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-8">
            {/* Avatar */}
            <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">Avatar</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-stone-400 dark:text-stone-500">
                      ?
                    </span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    PNG, JPG or WebP. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <form
              onSubmit={handleSaveProfile}
              className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800"
            >
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">
                Profile Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-stone-400 mt-1">{bio.length}/200</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Contact support to change your email
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            {/* Change Password */}
            <form
              onSubmit={handleChangePassword}
              className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800"
            >
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">
                Change Password
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    minLength={8}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    minLength={8}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || !newPassword || !confirmPassword}
                className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-red-200 dark:border-red-900/50">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Danger Zone
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                Sign out of your account on this device.
              </p>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">
                Appearance
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                Use the theme toggle in the navigation bar to switch between light, dark, and system
                themes.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">
                Account Info
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-600 dark:text-stone-400">Member since</span>
                  <span className="text-stone-900 dark:text-white">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '---'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-stone-600 dark:text-stone-400">Account type</span>
                  <span className="text-stone-900 dark:text-white">
                    {profile?.is_admin ? 'Admin' : 'Member'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-stone-600 dark:text-stone-400">User ID</span>
                  <span className="text-stone-500 dark:text-stone-500 font-mono text-xs">
                    {user?.id?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-800">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">
              Notification Preferences
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: 'XP & Achievements',
                  desc: 'Level ups, achievement unlocks, and XP milestones',
                  value: xpNotifications,
                  setter: setXpNotifications,
                },
                {
                  label: 'Community',
                  desc: 'Likes, comments, and replies on your posts',
                  value: communityNotifications,
                  setter: setCommunityNotifications,
                },
                {
                  label: 'Email Digest',
                  desc: 'Weekly summary of your garden activity',
                  value: emailNotifications,
                  setter: setEmailNotifications,
                },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-3 border-b border-stone-100 dark:border-stone-800 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.setter(!item.value)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      item.value ? 'bg-green-600' : 'bg-stone-300 dark:bg-stone-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        item.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-4">
              Notification preferences are saved locally. Email notifications require email
              verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
