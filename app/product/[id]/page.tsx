import { Metadata } from "next"
import { ProductDetail } from "@/components/product-detail"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { ProductSchema, BreadcrumbSchema } from "@/components/structured-data"
import type { Product } from "@/lib/supabase/database.types"

type Props = {
  params: Promise<{ id: string }>
}

type ProductMetadata = {
  name: string
  description: string | null
  image: string
  images: string[] | null
  series: string
  price: number
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('products')
      .select('name, description, image, images, series, price')
      .eq('id', id)
      .single()

    const product = data as ProductMetadata | null

    if (!product) {
      return {
        title: 'Product Not Found',
      }
    }

    const description = product.description
      ? `${product.description.slice(0, 150)}...`
      : `Buy ${product.name} - ${product.series} die-cast model car. Premium collectible scale model.`

    const imageUrl = product.images?.[0] || product.image

    return {
      title: product.name,
      description,
      alternates: {
        canonical: `https://wheelsframes.com/product/${id}`,
      },
      openGraph: {
        title: `${product.name} | Wheels Frames`,
        description,
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
        type: 'website',
        url: `https://wheelsframes.com/product/${id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return {
      title: 'Product',
    }
  }
}

type Review = {
  rating: number
  author_name: string
  created_at: string
  comment: string
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  // Fetch product and reviews for structured data
  let product: Product | null = null
  let reviews: Review[] = []

  try {
    const supabase = getSupabaseAdmin()

    // Fetch product
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    product = productData as Product | null

    // Fetch approved reviews for schema
    if (product) {
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating, author_name, created_at, comment')
        .eq('product_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10)
      reviews = (reviewsData as Review[]) || []
    }
  } catch {
    // Product will be null, component will handle error
  }

  return (
    <>
      {product && (
        <>
          <ProductSchema product={product} reviews={reviews} />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: 'https://wheelsframes.com' },
              { name: 'Collection', url: 'https://wheelsframes.com/collection' },
              { name: product.name, url: `https://wheelsframes.com/product/${id}` },
            ]}
          />
        </>
      )}
      <ProductDetail productId={id} />
    </>
  )
}
