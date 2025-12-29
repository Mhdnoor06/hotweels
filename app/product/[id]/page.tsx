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
      openGraph: {
        title: `${product.name} | Wheels Frames`,
        description,
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
        type: 'website',
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

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  // Fetch product for structured data
  let product: Product | null = null
  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    product = data as Product | null
  } catch {
    // Product will be null, component will handle error
  }

  return (
    <>
      {product && (
        <>
          <ProductSchema product={product} />
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
