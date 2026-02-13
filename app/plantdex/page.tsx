'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Plant {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string;
  care_difficulty: number;
  water_frequency: string;
  sunlight: string;
  icon: string;
  xp_reward: number;
  growth_stages: number;
  growth_time_hours: number;
  is_premium: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  succulent:
    'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  fern: 'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  herb: 'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  flower:
    'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  tree: 'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
};

const DIFFICULTY_LABELS = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
const DIFFICULTY_COLORS = [
  '',
  'text-green-600 dark:text-green-400',
  'text-green-500 dark:text-green-400',
  'text-stone-600 dark:text-stone-400',
  'text-stone-700 dark:text-stone-300',
  'text-stone-800 dark:text-stone-200',
];

function SunlightIcon({ type }: { type: string }) {
  switch (type) {
    case 'full':
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-0.5 -mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      );
    case 'partial':
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-0.5 -mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
          />
        </svg>
      );
    case 'shade':
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-0.5 -mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-0.5 -mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      );
  }
}

const PLANT_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  succulent: (
    <svg
      className="w-7 h-7 text-green-600 dark:text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  ),
  fern: (
    <svg
      className="w-7 h-7 text-green-600 dark:text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036"
      />
    </svg>
  ),
  herb: (
    <svg
      className="w-7 h-7 text-green-600 dark:text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  ),
  flower: (
    <svg
      className="w-7 h-7 text-green-600 dark:text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 3.75V16.5"
      />
    </svg>
  ),
  tree: (
    <svg
      className="w-7 h-7 text-green-600 dark:text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  ),
};

function PlantCategoryIcon({ category }: { category: string }) {
  const icon = PLANT_CATEGORY_ICONS[category];
  if (icon) return <>{icon}</>;
  return (
    <svg
      className="w-7 h-7 text-green-600 dark:text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"
      />
    </svg>
  );
}

const WATER_LABELS: Record<string, string> = {
  daily: 'Daily',
  'twice-weekly': '2x/week',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

export default function PlantdexPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plantdex');
      const data = await response.json();
      if (data.success) {
        setPlants(data.plants);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlants = plants.filter(plant => {
    const matchesCategory = !selectedCategory || plant.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedPlants = filteredPlants.reduce(
    (acc, plant) => {
      if (!acc[plant.category]) {
        acc[plant.category] = [];
      }
      acc[plant.category].push(plant);
      return acc;
    },
    {} as Record<string, Plant[]>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 h-12 w-48 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
                Plantdex
              </h1>
              <p className="mt-1 text-stone-500 dark:text-stone-400">
                Discover {plants.length} plant species to grow in your garden
              </p>
            </div>
            <Link
              href="/my-plants"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-500"
            >
              My Plants
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search plants..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  !selectedCategory
                    ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category === selectedCategory ? null : category)
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                    selectedCategory === category
                      ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {category}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plant Grid */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {Object.entries(groupedPlants).map(([category, categoryPlants]) => (
          <div key={category} className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight capitalize text-stone-900 dark:text-white">
              <span
                className={`inline-block rounded-xl border px-3 py-1 text-sm ${CATEGORY_COLORS[category] || ''}`}
              >
                {category}s
              </span>
              <span className="text-stone-500 dark:text-stone-400">({categoryPlants.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryPlants.map(plant => (
                <button
                  key={plant.id}
                  onClick={() => setSelectedPlant(plant)}
                  className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-left transition hover:border-stone-300 dark:hover:border-stone-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <PlantCategoryIcon category={plant.category} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold tracking-tight text-stone-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                        {plant.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
                        {plant.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`font-medium ${DIFFICULTY_COLORS[plant.care_difficulty]}`}>
                      {DIFFICULTY_LABELS[plant.care_difficulty]}
                    </span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500 dark:text-stone-400">
                      <SunlightIcon type={plant.sunlight} /> {plant.sunlight}
                    </span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-500 dark:text-stone-400">
                      {WATER_LABELS[plant.water_frequency]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-200 dark:border-stone-800 pt-3">
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {plant.growth_stages} stages
                    </span>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                      +{plant.xp_reward} XP
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredPlants.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-xl font-medium tracking-tight text-stone-900 dark:text-white">
              No plants found
            </p>
            <p className="mt-2 text-stone-500 dark:text-stone-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Plant Detail Modal */}
      {selectedPlant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-stone-950/70 p-4"
          onClick={() => setSelectedPlant(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <div className="scale-125">
                    <PlantCategoryIcon category={selectedPlant.category} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                    {selectedPlant.name}
                  </h2>
                  <span
                    className={`mt-1 inline-block rounded-xl border px-2 py-0.5 text-sm capitalize ${CATEGORY_COLORS[selectedPlant.category] || ''}`}
                  >
                    {selectedPlant.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlant(null)}
                className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-stone-600 dark:text-stone-300">{selectedPlant.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">Difficulty</p>
                <p
                  className={`mt-1 font-medium ${DIFFICULTY_COLORS[selectedPlant.care_difficulty]}`}
                >
                  {DIFFICULTY_LABELS[selectedPlant.care_difficulty]}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">XP Reward</p>
                <p className="mt-1 font-medium text-green-600 dark:text-green-400">
                  +{selectedPlant.xp_reward} XP
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">Sunlight</p>
                <p className="mt-1 font-medium capitalize text-stone-900 dark:text-white">
                  <SunlightIcon type={selectedPlant.sunlight} /> {selectedPlant.sunlight}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">Watering</p>
                <p className="mt-1 font-medium text-stone-900 dark:text-white">
                  {WATER_LABELS[selectedPlant.water_frequency]}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">Growth Stages</p>
                <p className="mt-1 font-medium text-stone-900 dark:text-white">
                  {selectedPlant.growth_stages} stages
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">Time to Mature</p>
                <p className="mt-1 font-medium text-stone-900 dark:text-white">
                  {Math.round(selectedPlant.growth_time_hours / 24)} days
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedPlant(null)}
                className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2 font-medium text-stone-900 dark:text-white transition hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                Close
              </button>
              <Link
                href="/my-plants"
                className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-center font-medium text-white transition hover:bg-green-500"
              >
                Plant This
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
