import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | Plobie',
  description:
    'Stay updated with your Plobie notifications. See likes, comments, achievements, and more.',
  openGraph: {
    title: 'Notifications | Plobie',
    description: 'Your Plobie notifications.',
    type: 'website',
  },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
