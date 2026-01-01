import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ConditionalFooter } from "@/components/conditional-footer";
import { Providers } from "@/context/providers";
import { OrganizationSchema, WebsiteSchema } from "@/components/structured-data";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://wheelsframes.com'),
  title: {
    default: 'Wheels Frames | Premium Die-Cast Model Cars India',
    template: '%s | Wheels Frames',
  },
  description: 'Wheels Frames - India\'s finest collection of premium die-cast model cars. Shop authentic scale models from Ferrari, Lamborghini, Porsche & more. Free shipping on orders over ₹999.',
  keywords: ['Wheels Frames', 'WheelsFrames', 'die-cast cars', 'model cars India', 'collectible cars', 'Ferrari models', 'Lamborghini models', 'Porsche models', 'scale models', 'car collection India'],
  authors: [{ name: 'Wheels Frames' }],
  creator: 'Wheels Frames',
  publisher: 'Wheels Frames',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://wheelsframes.com',
    siteName: 'Wheels Frames',
    title: 'Wheels Frames - Premium Die-Cast Model Cars',
    description: 'Shop premium die-cast model cars from Ferrari, Lamborghini, Porsche & more. India\'s finest collection of authentic scale models.',
    images: [
      {
        url: 'https://wheelsframes.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Wheels Frames - Premium Die-Cast Model Cars Collection',
      },
      {
        url: 'https://wheelsframes.com/darklogo.jpg',
        width: 512,
        height: 512,
        alt: 'Wheels Frames Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wheels Frames - Premium Die-Cast Model Cars',
    description: 'Shop premium die-cast model cars from Ferrari, Lamborghini, Porsche & more. India\'s finest collection of authentic scale models.',
    images: ['https://wheelsframes.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <Providers>
          {children}
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
