import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Plobie',
  description: 'Plobie admin dashboard for managing users, content, and system settings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
