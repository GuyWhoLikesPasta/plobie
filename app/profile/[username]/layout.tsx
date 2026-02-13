import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name, bio')
      .eq('username', username)
      .single();

    if (profile) {
      return {
        title: `${profile.full_name || profile.username} (@${profile.username})`,
        description: profile.bio || `Check out ${profile.username}'s profile on Plobie`,
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    title: `@${username}`,
    description: 'User profile on Plobie',
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
