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
    const { data: article } = await supabase
      .from('articles')
      .select('title, description, category')
      .eq('id', id)
      .single();

    if (article) {
      return {
        title: article.title,
        description: article.description || `Learn about ${article.category} on Plobie`,
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    title: 'Learn',
    description: 'Educational content on Plobie',
  };
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
