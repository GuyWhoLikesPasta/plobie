import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Plobie',
  description: 'Manage your Plobie account settings and preferences',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
