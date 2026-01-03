import type { Product } from '@/lib/supabase/database.types'

type Review = {
  rating: number
  author_name: string
  created_at: string
  comment: string
}

// Organization schema for homepage
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Wheels Frames',
    alternateName: ['Wheels Frames', 'WheelsFrames', 'Wheels Frames India'],
    url: 'https://wheelsframes.com',
    logo: 'https://wheelsframes.com/darklogo.jpg',
    description: 'Wheels Frames - India\'s premier destination for premium die-cast model cars featuring Ferrari, Lamborghini, Porsche and more luxury brands.',
    sameAs: [],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Product schema for product pages with optional reviews
export function ProductSchema({ product, reviews }: { product: Product; reviews?: Review[] }) {
  // Calculate priceValidUntil (1 year from now in ISO format)
  const priceValidUntil = new Date()
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1)
  const priceValidUntilISO = priceValidUntil.toISOString().split('T')[0] // Format as YYYY-MM-DD

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Premium die-cast model car`,
    image: product.images || [product.image],
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.series || 'Wheels Frames',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      priceValidUntil: priceValidUntilISO,
      availability: (product.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://wheelsframes.com/product/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: 'Wheels Frames',
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        returnPolicySeasonalOverride: {
          '@type': 'MerchantReturnPolicySeasonalOverride',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 30,
        },
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: product.price >= 999 ? 0 : 99,
          currency: 'INR',
        },
        freeShippingThreshold: {
          '@type': 'MonetaryAmount',
          value: 999,
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
    },
  }

  // Only include aggregateRating when there are actual reviews
  // Google doesn't accept empty/zero values for these fields
  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    }

    // Only include reviews when they exist
    schema.review = reviews.slice(0, 5).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author_name },
      datePublished: r.created_at,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.comment,
    }))
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
    logo: 'https://wheelsframes.com/darklogo.jpg',
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

// CollectionPage schema for collection page
export function CollectionPageSchema({ totalProducts }: { totalProducts: number }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Die-Cast Model Cars Collection',
    description: 'Premium die-cast model cars from Ferrari, Lamborghini, Porsche and more.',
    url: 'https://wheelsframes.com/collection',
    numberOfItems: totalProducts,
    provider: {
      '@type': 'Organization',
      name: 'Wheels Frames',
      url: 'https://wheelsframes.com',
      logo: 'https://wheelsframes.com/darklogo.jpg',
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// FAQ schema for common questions
export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What scale are your die-cast model cars?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer die-cast model cars in various scales including 1:18, 1:24, 1:43, and 1:64. Each product listing specifies the exact scale.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you ship internationally?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are your die-cast models authentic licensed products?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all our die-cast models are officially licensed products from authorized manufacturers.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is your return policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer a 30-day return policy for unused items in original packaging. Contact our support team to initiate a return.',
        },
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// LocalBusiness/Store schema
export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Wheels Frames',
    description: 'Premium die-cast model cars and collectibles',
    url: 'https://wheelsframes.com',
    logo: 'https://wheelsframes.com/darklogo.jpg',
    image: 'https://wheelsframes.com/og-image.jpg',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    sameAs: [],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
