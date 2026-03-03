import Link from 'next/link';

const footerNav = [
  {
    title: 'Explore',
    links: [
      { name: 'Shop', href: '/shop' },
      { name: 'Community', href: '/hobbies' },
      { name: 'Learn', href: '/hobbies/learn' },
      { name: 'Game Play', href: '/gameplay' },
    ],
  },
  {
    title: 'Account',
    links: [
      { name: 'My Plants', href: '/my-plants' },
      { name: 'Plantdex', href: '/my-plants?tab=plantdex' },
      { name: 'Achievements', href: '/achievements' },
      { name: 'Settings', href: '/settings' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'Gift Cards', href: '/shop/gift-cards' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2zm0-18C7.6 4 4 7 4 11c0 2.4 1.2 5.5 2 7h12c.8-1.5 2-4.6 2-7 0-4-3.6-7-8-7zm-1 3.5c0-.3.2-.5.5-.5s.5.2.5.5v4c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4z" />
                </svg>
              </div>
              <span className="font-bold text-stone-900 dark:text-white">Plobie</span>
            </Link>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Where plant lovers grow together. Shop, learn, play, and connect.
            </p>
          </div>

          {/* Nav columns */}
          {footerNav.map(section => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800">
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Plobie. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
