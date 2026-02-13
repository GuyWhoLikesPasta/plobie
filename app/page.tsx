import Link from 'next/link';

const features = [
  {
    title: 'Shop',
    description: 'Handcrafted pottery and curated plant accessories from independent makers.',
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
    title: 'Community',
    description: 'Connect with fellow plant enthusiasts. Share tips, photos, and grow together.',
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
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
  {
    title: 'My Garden',
    description: 'Track your plants, monitor health, and build your personal botanical collection.',
    href: '/my-plants',
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
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Play',
    description: 'Immersive 3D plant world. Earn XP, unlock achievements, and level up.',
    href: '/games',
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
];

const xpActions = [
  { label: 'Claim a Pot', xp: '+500', sublabel: 'Link physical pottery' },
  { label: 'Write a Post', xp: '+20', sublabel: 'Share with community' },
  { label: 'Play 30 min', xp: '+20', sublabel: 'Explore the world' },
  { label: 'Read an Article', xp: '+10', sublabel: 'Expand knowledge' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Light mode: clean warm white. Dark mode: subtle green glow */}
        <div className="absolute inset-0 bg-stone-50 dark:bg-stone-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-stone-50 to-white dark:from-stone-950 dark:via-stone-900/50 dark:to-stone-950" />
        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/[0.03] dark:bg-green-500/[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-500/[0.02] dark:bg-green-500/[0.03] rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pt-28 sm:pb-40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200/60 dark:border-green-800/40 text-green-700 dark:text-green-400 text-xs font-medium tracking-wide uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Now live with 3D garden
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] mb-6">
              <span className="text-stone-900 dark:text-white">Where plant lovers</span>
              <br />
              <span className="text-green-600 dark:text-green-400">grow together</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-lg">
              Connect, learn, shop handcrafted pottery, and cultivate a digital garden that grows
              with you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-medium rounded-xl transition-all text-sm"
              >
                Get started free
                <svg
                  className="w-3.5 h-3.5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-6 py-3 text-stone-600 dark:text-stone-300 font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-sm"
              >
                Browse the shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map(feature => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-5 sm:p-6 hover:border-green-200 dark:hover:border-green-900/50 transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-950/50"
            >
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400 mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {feature.description}
              </p>
              <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-green-500 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* XP System */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-stone-950 dark:bg-stone-900/60 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden relative">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <p className="text-xs font-medium tracking-widest uppercase text-green-400 mb-3">
              Progression
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Earn XP. Level up.</h2>
            <p className="text-stone-400 text-sm sm:text-base mb-8 max-w-lg">
              Every action earns experience points. Climb 250 levels, unlock achievements, and watch
              your garden flourish.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {xpActions.map(action => (
                <div
                  key={action.label}
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:bg-white/[0.07] transition-colors"
                >
                  <p className="text-lg sm:text-xl font-bold text-green-400 mb-1 tracking-tight">
                    {action.xp}
                  </p>
                  <p className="text-sm font-medium text-white mb-0.5">{action.label}</p>
                  <p className="text-xs text-stone-500">{action.sublabel}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-stone-600 mt-6">
              Daily cap: 3,000 XP to keep things balanced
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-100 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-3 tracking-tight">
              Start growing today
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-8 text-sm sm:text-base">
              Join a community of plant lovers building something beautiful together.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-600/15 hover:shadow-green-500/25 text-sm"
            >
              Create free account
            </Link>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
