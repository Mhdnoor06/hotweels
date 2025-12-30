import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Wheels Frames. Questions about orders, products, or collaborations? We are here to help.',
  openGraph: {
    title: 'Contact Us | Wheels Frames',
    description: 'Get in touch with Wheels Frames for any questions or support.',
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
