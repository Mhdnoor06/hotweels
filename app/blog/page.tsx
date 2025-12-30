import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Blog - Die-Cast Model Car News & Guides',
  description: 'Expert guides on die-cast model car collecting, reviews, and news from the world of scale models.',
  alternates: {
    canonical: 'https://wheelsframes.com/blog',
  },
  openGraph: {
    title: 'Blog - Die-Cast Model Car News & Guides | Wheels Frames',
    description: 'Expert guides on die-cast model car collecting, reviews, and news from the world of scale models.',
    images: [
      {
        url: 'https://wheelsframes.com/darklogo.jpg',
        width: 512,
        height: 512,
        alt: 'Wheels Frames Logo',
      },
    ],
  },
}

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        Our blog with collecting guides, reviews, and news about die-cast model cars is launching soon!
      </p>
    </div>
  )
}
