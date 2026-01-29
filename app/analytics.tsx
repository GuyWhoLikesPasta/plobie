'use client';

import dynamic from 'next/dynamic';

// Lazy load analytics to not block initial render
const Analytics = dynamic(() => import('@vercel/analytics/react').then(mod => mod.Analytics), {
  ssr: false,
});

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/react').then(mod => mod.SpeedInsights),
  { ssr: false }
);

export function AnalyticsProviders() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
