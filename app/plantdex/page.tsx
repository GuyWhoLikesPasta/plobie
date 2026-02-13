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

const SUNLIGHT_ICONS: Record<string, string> = {
  full: '☀️',
  partial: '⛅',
  shade: '🌙',
};

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
                    <span className="text-4xl">{plant.icon}</span>
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
                      {SUNLIGHT_ICONS[plant.sunlight]} {plant.sunlight}
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
                <span className="text-6xl">{selectedPlant.icon}</span>
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
                  {SUNLIGHT_ICONS[selectedPlant.sunlight]} {selectedPlant.sunlight}
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
