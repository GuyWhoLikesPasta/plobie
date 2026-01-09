import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Games | Plobie',
  description:
    'Play Plobie games to earn XP and level up! Help your virtual plants grow while learning plant care skills.',
  openGraph: {
    title: 'Games | Plobie',
    description: 'Play games and earn XP on Plobie.',
    type: 'website',
  },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
