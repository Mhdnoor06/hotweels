import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Die-Cast Model Cars Collection | Ferrari, Lamborghini, Porsche',
  description: 'Shop our complete collection of premium die-cast model cars. Find scale models from Ferrari, Lamborghini, Porsche, Mercedes, BMW & more top brands. Free shipping available.',
  keywords: ['die-cast model cars', 'scale model cars', 'collectible cars', 'Ferrari models', 'Lamborghini models', 'Porsche models', 'luxury car models'],
  openGraph: {
    title: 'Die-Cast Model Cars Collection | Wheels Frames',
    description: 'Shop our complete collection of premium die-cast model cars from top luxury brands.',
    url: 'https://wheelsframes.com/collection',
    type: 'website',
    images: [
      {
        url: 'https://wheelsframes.com/darklogo.jpg',
        width: 512,
        height: 512,
        alt: 'Wheels Frames Logo',
      },
    ],
  },
  alternates: {
    canonical: 'https://wheelsframes.com/collection',
  },
}

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
