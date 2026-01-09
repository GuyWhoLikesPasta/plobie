'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { checkAndShowAchievements } from '@/lib/achievement-toast';

// Sample articles (will move to database later)
const articles: Record<string, any> = {
  '550e8400-e29b-41d4-a716-446655440001': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Complete Guide to Indoor Plant Care',
    category: 'Indoor Plants',
    icon: '🪴',
    readTime: '8 min read',
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
  // Add minimal content for other articles
};

// Fill in minimal content for remaining articles
[
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440006',
].forEach((id, index) => {
  const titles = [
    'Growing Herbs Indoors Year-Round',
    'Orchid Care Mastery',
    'Bonsai Basics for Beginners',
    'Propagation Techniques That Always Work',
  ];
  const icons = ['🌿', '🌸', '🌳', '🌱'];
  articles[id] = {
    id,
    title: titles[index],
    category: 'Plant Care',
    icon: icons[index],
    readTime: '7 min read',
    content: `# ${titles[index]}\n\nThis comprehensive guide will help you master the art of ${titles[index].toLowerCase()}. Stay tuned for detailed content!\n\n## Coming Soon\nFull content for this article is being prepared. Check back soon!`,
  };
});

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string>('');
  const [article, setArticle] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [marking, setMarking] = useState(false);
  const [hasRead, setHasRead] = useState(false);

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
    checkAuth();
  }, [params, router]);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
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

        // Check for newly unlocked achievements
        checkAndShowAchievements();
      } else {
        if (data.error?.code === 'ALREADY_EXISTS') {
          setHasRead(true);
          toast.success("You've already read this article!");
        } else {
          toast.error(data.error?.message || 'Failed to mark as read');
        }
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setMarking(false);
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/hobbies/learn')}
          className="mb-6 text-green-600 hover:text-green-700 font-medium flex items-center"
        >
          ← Back to Learn
        </button>

        {/* Article Card */}
        <article className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-6">
          <div className="text-5xl sm:text-6xl mb-4">{article.icon}</div>
          <div className="text-xs sm:text-sm text-green-600 font-medium mb-2">
            {article.category}
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b">
            <span>{article.readTime}</span>
            <span>•</span>
            <span className="text-green-600 font-medium">+1 XP on completion</span>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none text-gray-800">
            {article.content.split('\n').map((line: string, index: number) => {
              if (line.startsWith('# ')) {
                return (
                  <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-gray-900">
                    {line.slice(2)}
                  </h1>
                );
              } else if (line.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-gray-900">
                    {line.slice(3)}
                  </h2>
                );
              } else if (line.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-gray-900">
                    {line.slice(4)}
                  </h3>
                );
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={index} className="font-bold mt-2 text-gray-900">
                    {line.slice(2, -2)}
                  </p>
                );
              } else if (line.startsWith('- ')) {
                return (
                  <li key={index} className="ml-6 text-gray-700">
                    {line.slice(2)}
                  </li>
                );
              } else if (line.trim() === '') {
                return <br key={index} />;
              } else {
                return (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                    {line}
                  </p>
                );
              }
            })}
          </div>
        </article>

        {/* Mark as Read Button */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 sm:p-6 text-center">
          {hasRead ? (
            <div>
              <div className="text-3xl sm:text-4xl mb-2">✅</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Article Completed!</h3>
              <p className="text-sm sm:text-base text-green-100">
                You have earned XP for reading this article
              </p>
            </div>
          ) : isAuthenticated ? (
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Finished reading?</h3>
              <button
                onClick={handleMarkAsRead}
                disabled={marking}
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-all disabled:opacity-50"
              >
                {marking ? 'Marking...' : 'Mark as Read (+1 XP)'}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Log in to earn XP for reading</h3>
              <button
                onClick={() => router.push(`/login?redirect=/hobbies/learn/${articleId}`)}
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-all"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
