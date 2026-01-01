import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/cart', '/checkout', '/wishlist', '/orders', '/sitemap.xml', '/robots.txt'],
      },
    ],
    sitemap: 'https://wheelsframes.com/sitemap.xml',
  }
}
