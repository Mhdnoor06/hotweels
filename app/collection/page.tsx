import CollectionPage from "@/components/collection-page"
import { CollectionPageSchema } from "@/components/structured-data"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export default async function Collection() {
  // Get total product count for schema
  let totalProducts = 0
  try {
    const supabase = getSupabaseAdmin()
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    totalProducts = count || 0
  } catch {
    // Fallback to 0
  }

  return (
    <>
      <CollectionPageSchema totalProducts={totalProducts} />
      <CollectionPage />
    </>
  )
}
