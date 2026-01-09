import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Achievements | Plobie',
  description:
    'Track your plant journey achievements! Earn badges, level up, and unlock rewards as you grow your green thumb.',
  openGraph: {
    title: 'Achievements | Plobie',
    description: 'Earn badges and level up your plant journey on Plobie.',
    type: 'website',
  },
};

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
