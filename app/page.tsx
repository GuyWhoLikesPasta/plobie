import Link from 'next/link';

const features = [
  {
    title: 'Shop',
    description: 'Handcrafted pottery and curated plant accessories from independent makers.',
    href: '/shop',
    gradient: 'from-amber-500 to-orange-600',
    icon: (
      <svg
        className="w-6 h-6"
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
    gradient: 'from-green-500 to-emerald-600',
    icon: (
      <svg
        className="w-6 h-6"
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
    gradient: 'from-teal-500 to-cyan-600',
    icon: (
      <svg
        className="w-6 h-6"
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
    gradient: 'from-violet-500 to-purple-600',
    icon: (
      <svg
        className="w-6 h-6"
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
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50/50 to-stone-50 dark:from-green-950/20 dark:via-stone-950 dark:to-stone-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-100/40 via-transparent to-transparent dark:from-green-900/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Now live with 3D Unity garden
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 dark:text-white leading-[1.1] mb-6">
              Where plant lovers
              <span className="text-green-600 dark:text-green-400"> grow together</span>
            </h1>

            <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 leading-relaxed mb-10 max-w-2xl">
              A platform for plant enthusiasts to connect, learn, shop handcrafted pottery, and
              cultivate a digital garden that grows with you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-500/30 text-sm sm:text-base"
              >
                Create your garden
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="inline-flex items-center justify-center px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all text-sm sm:text-base"
              >
                Browse the shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(feature => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 hover:border-transparent transition-all hover:shadow-xl dark:hover:shadow-stone-950/50"
            >
              <div
                className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${feature.gradient} text-white mb-4 shadow-lg shadow-stone-900/5`}
              >
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-white mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                {feature.description}
              </p>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-4 h-4 text-stone-400"
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
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* XP System */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-stone-900 dark:bg-stone-800/50 rounded-3xl p-8 sm:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Earn XP. Level up.</h2>
            <p className="text-stone-400 mb-8 max-w-xl">
              Every action earns experience points. Climb 250 levels, unlock achievements, and watch
              your garden flourish.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {xpActions.map(action => (
                <div
                  key={action.label}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-5"
                >
                  <p className="text-xl sm:text-2xl font-bold text-green-400 mb-1">{action.xp}</p>
                  <p className="text-sm font-medium text-white mb-0.5">{action.label}</p>
                  <p className="text-xs text-stone-500">{action.sublabel}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-stone-500 mt-6">
              Daily cap: 3,000 XP to keep things balanced
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4">
            Start growing today
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-8 text-lg">
            Join a community of plant lovers building something beautiful together.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-500/30 text-base"
          >
            Create free account
          </Link>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-4">No credit card required</p>
        </div>
      </section>
    </div>
  );
}
