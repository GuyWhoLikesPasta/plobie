import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: post } = await supabase
      .from('posts')
      .select('title, content, profiles(username)')
      .eq('id', id)
      .single();

    if (post) {
      const preview = post.content?.substring(0, 155) || '';
      return {
        title: post.title,
        description: preview + (preview.length >= 155 ? '...' : ''),
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    title: 'Community Post',
    description: 'A post from the Plobie community',
  };
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
