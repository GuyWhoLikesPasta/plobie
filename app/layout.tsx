import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import ToastProvider from '@/components/providers/ToastProvider';
import { AnalyticsProviders } from './analytics';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Plobie - Plant-Centered Social Commerce',
  description:
    'Connect with plant lovers, grow your digital garden, and shop for beautiful pottery.',
  keywords: [
    'plants',
    'pottery',
    'social commerce',
    'gardening',
    'plant community',
    'indoor plants',
  ],
  authors: [{ name: 'Plobie Team' }],
  openGraph: {
    title: 'Plobie - Plant-Centered Social Commerce',
    description:
      'Connect with plant lovers, grow your digital garden, and shop for beautiful pottery.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plobie - Plant-Centered Social Commerce',
    description:
      'Connect with plant lovers, grow your digital garden, and shop for beautiful pottery.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Unity Bridge - exposes window.plobie for WebGL auth */}
        <script src="/unity-bridge.js" defer />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider />
        <Navigation />
        {children}
        <AnalyticsProviders />
      </body>
    </html>
  );
}
