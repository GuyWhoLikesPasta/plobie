import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community | Plobie',
  description:
    'Join the Plobie plant community! Share your plant journey, get tips from fellow enthusiasts, and connect with plant lovers worldwide.',
  openGraph: {
    title: 'Community | Plobie',
    description: 'Join the Plobie plant community and share your plant journey.',
    type: 'website',
  },
};

export default function HobbiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
