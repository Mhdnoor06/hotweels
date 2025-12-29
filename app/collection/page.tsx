import { Metadata } from "next"
import CollectionPage from "@/components/collection-page"

export const metadata: Metadata = {
  title: 'Collection',
  description: 'Browse our complete collection of premium die-cast model cars. Ferrari, Lamborghini, Porsche, and more luxury brands available.',
  openGraph: {
    title: 'Collection | Wheels Frames',
    description: 'Browse our complete collection of premium die-cast model cars.',
  },
}

export default function Collection() {
  return <CollectionPage />
}
