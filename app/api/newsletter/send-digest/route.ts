import { createAdminClient } from '@/lib/supabase';
import { getResendClient, FROM_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

/**
 * Weekly digest mailer.
 * Triggered by Vercel Cron or manually by an admin POST.
 * Collects top posts + recent Learn articles and emails every
 * subscriber in batches.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const adminSupabase = createAdminClient();
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!bearerToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const {
        data: { user },
      } = await adminSupabase.auth.getUser(bearerToken);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const adminSupabase = createAdminClient();
    const resend = getResendClient();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [subscribersRes, postsRes, articlesRes] = await Promise.all([
      adminSupabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('newsletter_subscribed', true),
      adminSupabase
        .from('posts')
        .select('id, title, community, created_at, author:profiles(username)')
        .gte('created_at', sevenDaysAgo)
        .eq('hidden', false)
        .order('created_at', { ascending: false })
        .limit(5),
      adminSupabase
        .from('articles')
        .select('id, title, slug, category')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const subscribers = subscribersRes.data ?? [];
    const topPosts = postsRes.data ?? [];
    const recentArticles = articlesRes.data ?? [];

    if (subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscribers' });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://plobie.vercel.app';

    const postsHtml = topPosts
      .map(
        p =>
          `<li><a href="${baseUrl}/hobbies/post/${p.id}" style="color:#16a34a">${p.title || 'Untitled'}</a> in p/${p.community}</li>`
      )
      .join('');

    const articlesHtml = recentArticles
      .map(
        a =>
          `<li><a href="${baseUrl}/hobbies/learn/${a.slug || a.id}" style="color:#16a34a">${a.title}</a></li>`
      )
      .join('');

    const html = `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif;color:#1c1917">
        <h1 style="font-size:22px;color:#16a34a">Plobie Weekly Digest</h1>
        <p>Here's what's been growing in the community this week.</p>
        ${topPosts.length ? `<h2 style="font-size:16px">Top Posts</h2><ul>${postsHtml}</ul>` : ''}
        ${recentArticles.length ? `<h2 style="font-size:16px">New in Learn</h2><ul>${articlesHtml}</ul>` : ''}
        <p style="margin-top:24px"><a href="${baseUrl}" style="color:#16a34a;font-weight:600">Open Plobie &rarr;</a></p>
        <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0"/>
        <p style="font-size:12px;color:#a8a29e">You're receiving this because you subscribed to the Plobie newsletter. Manage preferences in your <a href="${baseUrl}/settings" style="color:#16a34a">account settings</a>.</p>
      </div>
    `.trim();

    const authUserPromises = subscribers.map(s => adminSupabase.auth.admin.getUserById(s.id));

    const authUsers = await Promise.all(authUserPromises);

    let sent = 0;
    const BATCH = 50;
    const recipientEmails = authUsers
      .map(res => res.data?.user?.email)
      .filter((e): e is string => !!e);

    for (let i = 0; i < recipientEmails.length; i += BATCH) {
      const batch = recipientEmails.slice(i, i + BATCH);
      await Promise.all(
        batch.map(email =>
          resend.emails
            .send({
              from: FROM_EMAIL,
              to: email,
              subject: "Plobie Weekly Digest — What's Growing This Week",
              html,
            })
            .then(() => {
              sent++;
            })
            .catch(err => console.error(`Failed to send to ${email}:`, err))
        )
      );
    }

    return NextResponse.json({
      success: true,
      sent,
      total_subscribers: subscribers.length,
    });
  } catch (error) {
    console.error('Error in POST /api/newsletter/send-digest:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
