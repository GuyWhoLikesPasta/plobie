import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plantdex - Plant Encyclopedia | Plobie',
  description:
    'Discover and learn about all the plant species you can grow in your Plobie garden. From easy succulents to challenging bonsai trees.',
  openGraph: {
    title: 'Plantdex - Plant Encyclopedia | Plobie',
    description: 'Discover all the plant species you can grow in your garden.',
  },
};

export default function PlantdexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
