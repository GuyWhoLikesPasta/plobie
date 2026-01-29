import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in or create an account to start your plant journey with Plobie.',
  openGraph: {
    title: 'Sign In',
    description: 'Join the Plobie plant community.',
    type: 'website',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
