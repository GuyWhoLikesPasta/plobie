'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface PromoCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

interface PromoRotatorProps {
  interval?: number;
}

const promos: PromoCard[] = [
  {
    title: 'Play Games',
    description: 'Explore the 3D plant world and earn XP.',
    href: '/gameplay',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
        />
      </svg>
    ),
  },
  {
    title: 'Browse the Shop',
    description: 'Handcrafted pottery and plant accessories.',
    href: '/shop',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Explore Plants',
    description: 'Browse the Plantdex and discover new species.',
    href: '/my-plants?tab=plantdex',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 11.25l1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 10-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94-.19-1.28-.53a1.81 1.81 0 010-2.56l8.47-8.47M15 11.25L12 8.25"
        />
      </svg>
    ),
  },
  {
    title: 'Join the Community',
    description: 'Share tips, photos, and grow together.',
    href: '/hobbies',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
  },
];

export default function PromoRotator({ interval = 8000 }: PromoRotatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const rotate = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setActiveIndex(prev => (prev + 1) % promos.length);
      setVisible(true);
    }, 300);
  }, []);

  useEffect(() => {
    const timer = setInterval(rotate, interval);
    return () => clearInterval(timer);
  }, [interval, rotate]);

  const promo = promos[activeIndex];

  return (
    <div className="relative">
      <Link
        href={promo.href}
        className={`group flex items-center gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-l-2 border-l-green-500 rounded-2xl p-4 hover:border-green-200 dark:hover:border-green-900/50 transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        <div className="shrink-0 w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
          {promo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-white">{promo.title}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{promo.description}</p>
        </div>
        <svg
          className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-green-500 transition-colors shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
      <div className="flex justify-center gap-1.5 mt-3">
        {promos.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setVisible(false);
              setTimeout(() => {
                setActiveIndex(i);
                setVisible(true);
              }, 300);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === activeIndex
                ? 'bg-green-500 w-4'
                : 'bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500'
            }`}
            aria-label={`Go to promo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
