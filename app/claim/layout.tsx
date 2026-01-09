import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claim Your Pot | Plobie',
  description:
    'Claim your QR-enabled pot and start tracking your plant journey! Scan the code on your pot to register it.',
  openGraph: {
    title: 'Claim Your Pot | Plobie',
    description: 'Register your QR-enabled pot and start your plant journey.',
    type: 'website',
  },
};

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
