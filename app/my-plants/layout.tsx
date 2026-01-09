import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Plants | Plobie',
  description:
    'Manage your plant collection with Plobie. Track growth, earn XP, and keep your plants thriving with our smart plant care system.',
  openGraph: {
    title: 'My Plants | Plobie',
    description: 'Track and manage your plant collection with Plobie.',
    type: 'website',
  },
};

export default function MyPlantsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
