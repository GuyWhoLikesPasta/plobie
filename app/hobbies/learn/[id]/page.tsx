'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { checkAndShowAchievements } from '@/lib/achievement-toast';

interface Article {
  id: string;
  title: string;
  category: string;
  icon: string;
  readTime: string;
  difficulty: string;
  content: string;
}

// Sample articles (will move to database later)
const articles: Record<string, Article> = {
  '550e8400-e29b-41d4-a716-446655440001': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Complete Guide to Indoor Plant Care',
    category: 'Indoor Plants',
    icon: '🪴',
    readTime: '8 min read',
    difficulty: 'Beginner',
    content: `# Complete Guide to Indoor Plant Care

## Understanding Your Indoor Environment

Indoor plants bring life and color to your home, but they require different care than outdoor plants. The key to success is understanding your home's unique environment.

### Light Requirements

Most indoor plants fall into three categories:

**Low Light Plants:**
- Snake plants (Sansevieria)
- Pothos
- ZZ plants
These plants can survive in areas far from windows or in rooms with minimal natural light.

**Medium Light Plants:**
- Spider plants
- Philodendrons
- Peace lilies
These plants do best near windows with filtered light or in bright rooms without direct sun.

**Bright Light Plants:**
- Succulents
- Cacti
- Fiddle leaf figs
These plants need direct sunlight for several hours each day.

## Watering Best Practices

The number one cause of indoor plant death is overwatering. Here's how to get it right:

### The Finger Test
Stick your finger 1-2 inches into the soil. If it feels dry, it's time to water. If it's still moist, wait a few more days.

### Drainage is Critical
Always use pots with drainage holes. Standing water leads to root rot.

### Water Quality
Let tap water sit overnight to allow chlorine to evaporate. Room temperature water is best.

## Humidity and Temperature

Most indoor plants prefer:
- Humidity: 40-60%
- Temperature: 65-75°F (18-24°C)

Increase humidity by:
- Grouping plants together
- Using a pebble tray with water
- Misting leaves (for some species)
- Running a humidifier

## Fertilizing Schedule

During growing season (spring and summer):
- Feed every 2-4 weeks with diluted liquid fertilizer
- Follow package instructions carefully

During dormant season (fall and winter):
- Reduce feeding to once a month or stop entirely

## Common Problems and Solutions

### Yellow Leaves
- Usually means overwatering
- Check soil moisture and drainage
- Allow soil to dry out before watering again

### Brown Tips
- Often due to low humidity or fluoride in water
- Increase humidity
- Use filtered or distilled water

### Leggy Growth
- Indicates insufficient light
- Move plant closer to a window
- Consider grow lights

## Pro Tips

1. **Rotate your plants** weekly for even growth
2. **Clean leaves** monthly to maximize photosynthesis
3. **Repot** every 1-2 years or when roots are visible
4. **Quarantine new plants** for 2 weeks to prevent pest spread

## Conclusion

With proper light, water, and care, your indoor plants will thrive for years to come. Remember: it's better to underwater than overwater, and patience is key!

Happy growing! 🌱`,
  },
  '550e8400-e29b-41d4-a716-446655440002': {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Succulent & Cacti Care 101',
    category: 'Succulents',
    icon: '🌵',
    readTime: '6 min read',
    difficulty: 'Beginner',
    content: `# Succulent & Cacti Care 101

Succulents and cacti are perfect for beginners and busy plant parents. Here's everything you need to know!

## Light Requirements

**Bright, Direct Light:** Succulents and cacti need 4-6 hours of direct sunlight daily. South-facing windows are ideal.

## Watering

**Less is More:** The golden rule is to water deeply but infrequently. Allow soil to dry completely between waterings. In summer, water every 1-2 weeks. In winter, water once a month or less.

## Soil

Use a well-draining cactus/succulent mix or create your own with:
- 2 parts potting soil
- 1 part perlite
- 1 part coarse sand

## Common Issues

- **Stretching:** Needs more light
- **Wrinkled leaves:** Needs water
- **Mushy stems:** Root rot from overwatering

Happy planting! 🌵`,
  },
};

// Fill in minimal content for remaining articles
const additionalArticles = [
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Growing Herbs Indoors Year-Round',
    icon: '🌿',
    category: 'Herbs & Edibles',
    difficulty: 'Intermediate',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Orchid Care Mastery',
    icon: '🌸',
    category: 'Orchids',
    difficulty: 'Advanced',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Bonsai Basics for Beginners',
    icon: '🌳',
    category: 'Bonsai',
    difficulty: 'Intermediate',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Propagation Techniques That Always Work',
    icon: '🌱',
    category: 'Propagation',
    difficulty: 'Beginner',
  },
];

additionalArticles.forEach(({ id, title, icon, category, difficulty }) => {
  articles[id] = {
    id,
    title,
    category,
    icon,
    readTime: '7 min read',
    difficulty,
    content: `# ${title}\n\nThis comprehensive guide will help you master the art of ${title.toLowerCase()}. Stay tuned for detailed content!\n\n## Coming Soon\nFull content for this article is being prepared. Check back soon!`,
  };
});

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string>('');
  const [article, setArticle] = useState<Article | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [marking, setMarking] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    params.then(({ id }) => {
      setArticleId(id);
      const foundArticle = articles[id];
      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        router.push('/hobbies/learn');
      }
    });
    checkAuthAndReadStatus();
  }, [params, router]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAuthAndReadStatus = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsAuthenticated(true);

      // Check if already read
      const { id } = await params;
      const { data: existingRead } = await supabase
        .from('article_reads')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', id)
        .single();

      if (existingRead) {
        setHasRead(true);
      }
    }
  };

  const handleMarkAsRead = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/hobbies/learn/${articleId}`);
      return;
    }

    setMarking(true);

    try {
      const response = await fetch('/api/learn/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });

      const data = await response.json();

      if (data.success) {
        setHasRead(true);
        toast.success(`Great! You earned +${data.data.xp_awarded} XP for reading this article!`);
        checkAndShowAchievements();
      } else {
        if (data.error?.code === 'ALREADY_EXISTS') {
          setHasRead(true);
          toast.success("You've already read this article!");
        } else {
          toast.error(data.error?.message || 'Failed to mark as read');
        }
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setMarking(false);
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/hobbies/learn"
          className="inline-flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Learn
        </Link>

        {/* Article Card */}
        <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Article Header */}
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-8 sm:p-10">
            <div className="text-7xl sm:text-8xl mb-4">{article.icon}</div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {article.category}
              </span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{article.readTime}</span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{article.difficulty}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {article.title}
            </h1>
          </div>

          {/* XP Badge */}
          <div className="px-8 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="text-green-800 dark:text-green-200 font-medium">
                {hasRead ? 'Article completed!' : 'Earn +1 XP by completing this article'}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
              {article.content.split('\n').map((line: string, index: number) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1
                      key={index}
                      className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white"
                    >
                      {line.slice(2)}
                    </h1>
                  );
                } else if (line.startsWith('## ')) {
                  return (
                    <h2
                      key={index}
                      className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
                    >
                      {line.slice(3)}
                    </h2>
                  );
                } else if (line.startsWith('### ')) {
                  return (
                    <h3
                      key={index}
                      className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white"
                    >
                      {line.slice(4)}
                    </h3>
                  );
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <p key={index} className="font-bold mt-4 mb-2 text-gray-900 dark:text-white">
                      {line.slice(2, -2)}
                    </p>
                  );
                } else if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="ml-6 text-gray-700 dark:text-gray-300 mb-1">
                      {line.slice(2)}
                    </li>
                  );
                } else if (line.match(/^\d+\.\s/)) {
                  return (
                    <li
                      key={index}
                      className="ml-6 text-gray-700 dark:text-gray-300 mb-1 list-decimal"
                    >
                      {line.replace(/^\d+\.\s/, '')}
                    </li>
                  );
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else {
                  return (
                    <p
                      key={index}
                      className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {line}
                    </p>
                  );
                }
              })}
            </div>
          </div>
        </article>

        {/* Mark as Read Button */}
        <div
          className={`rounded-2xl shadow-xl p-6 sm:p-8 text-center ${
            hasRead
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }`}
        >
          {hasRead ? (
            <div>
              <div className="text-4xl sm:text-5xl mb-3">✅</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Article Completed!</h3>
              <p className="text-green-100 mb-4">You have earned XP for reading this article</p>
              <Link
                href="/hobbies/learn"
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                Read More Articles →
              </Link>
            </div>
          ) : isAuthenticated ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Finished reading?</h3>
              <button
                onClick={handleMarkAsRead}
                disabled={marking}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all disabled:opacity-50 shadow-lg"
              >
                {marking ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Marking...
                  </span>
                ) : (
                  'Mark as Read (+1 XP) ⭐'
                )}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Log in to earn XP for reading
              </h3>
              <button
                onClick={() => router.push(`/login?redirect=/hobbies/learn/${articleId}`)}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-lg"
              >
                Log In to Earn XP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
