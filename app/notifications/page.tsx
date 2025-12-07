'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  metadata: any;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login?redirect=/notifications');
      return;
    }

    setIsAuthenticated(true);
    fetchNotifications();
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=50');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      });

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const deleteAllRead = async () => {
    if (!confirm('Delete all read notifications?')) return;

    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_all_read: true }),
      });

      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return '💬';
      case 'like':
        return '❤️';
      case 'level_up':
        return '🎉';
      case 'xp_cap':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return past.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🔔</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {unreadCount > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>All caught up! 🎉</span>
                )}
              </p>
            </div>
            
            <div className="flex gap-2 sm:gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 min-h-[44px] text-sm font-medium text-green-600 hover:text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition"
                >
                  Mark all read
                </button>
              )}
              {notifications.some(n => n.read) && (
                <button
                  onClick={deleteAllRead}
                  className="px-4 py-2 min-h-[44px] text-sm font-medium text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  Delete read
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', icon: '📋' },
                { key: 'unread', label: 'Unread', icon: '🟢' },
                { key: 'comment', label: 'Comments', icon: '💬' },
                { key: 'like', label: 'Likes', icon: '❤️' },
                { key: 'level_up', label: 'Level Up', icon: '🎉' },
                { key: 'xp_cap', label: 'XP Cap', icon: '⚠️' },
                { key: 'system', label: 'System', icon: '🔔' },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 sm:px-4 py-2 min-h-[44px] rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                    filter === key
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  {key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">🔔</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md mx-auto">
              {filter === 'unread'
                ? "You're all caught up! Check back later for updates on your posts and activity."
                : 'Notifications will appear here when you receive comments, likes, level up, or reach your daily XP cap.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 min-h-[48px] bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-md"
              >
                🏠 Go to Home
              </Link>
              <Link
                href="/hobbies"
                className="inline-flex items-center justify-center px-6 py-3 min-h-[48px] bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                💬 Browse Hobbies
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border ${
                  !notification.read 
                    ? 'border-l-4 border-green-500 bg-green-50/30' 
                    : 'border-gray-200'
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className="text-3xl sm:text-4xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          onClick={() => markAsRead(notification.id)}
                          className="block group"
                        >
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition">
                            {notification.title}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </Link>
                      ) : (
                        <>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Mark as read"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Showing count */}
        {filteredNotifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        )}
      </div>
    </div>
  );
}

