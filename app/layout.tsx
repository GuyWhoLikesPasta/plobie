import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import ToastProvider from '@/components/providers/ToastProvider';
import { AnalyticsProviders } from './analytics';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://plobie.vercel.app'),
  title: {
    default: 'Plobie - Plant-Centered Social Commerce',
    template: '%s | Plobie',
  },
  description:
    'Connect with plant lovers, grow your digital garden, and shop for beautiful pottery. Join the Plobie community today!',
  keywords: [
    'plants',
    'pottery',
    'social commerce',
    'gardening',
    'plant community',
    'indoor plants',
    'plant care',
    'digital garden',
    'plant games',
    'succulent care',
    'houseplants',
  ],
  authors: [{ name: 'Plobie Team' }],
  creator: 'Plobie',
  publisher: 'Plobie',
  openGraph: {
    title: 'Plobie - Plant-Centered Social Commerce',
    description:
      'Connect with plant lovers, grow your digital garden, and shop for beautiful pottery.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Plobie',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plobie - Plant-Centered Social Commerce',
    description:
      'Connect with plant lovers, grow your digital garden, and shop for beautiful pottery.',
    creator: '@plobie',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have the verification codes
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Plobie',
              description: 'Plant-centered social commerce platform',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://plobie.vercel.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://plobie.vercel.app'}/shop?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Plobie',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://plobie.vercel.app',
              logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://plobie.vercel.app'}/favicon.ico`,
              sameAs: [],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: 'English',
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ToastProvider />
          <Navigation />
          {children}
          <AnalyticsProviders />
        </ThemeProvider>
      </body>
    </html>
  );
}
