import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://plobie.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/settings/', '/my-plants/', '/notifications/', '/claim/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
