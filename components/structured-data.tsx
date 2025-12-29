import type { Product } from '@/lib/supabase/database.types'

// Organization schema for homepage
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Wheels Frames',
    url: 'https://wheelsframes.com',
    logo: 'https://wheelsframes.com/logo.png',
    description: 'Premium die-cast model cars collection featuring Ferrari, Lamborghini, Porsche and more luxury brands.',
    sameAs: [],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Product schema for product pages
export function ProductSchema({ product }: { product: Product }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Premium die-cast model car`,
    image: product.images || [product.image],
    brand: {
      '@type': 'Brand',
      name: product.series || 'Wheels Frames',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: (product.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://wheelsframes.com/product/${product.id}`,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// WebSite schema with search
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Wheels Frames',
    url: 'https://wheelsframes.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://wheelsframes.com/collection?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// BreadcrumbList schema
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
