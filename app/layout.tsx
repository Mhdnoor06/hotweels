import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ConditionalFooter } from "@/components/conditional-footer";
import { Providers } from "@/context/providers";
import { OrganizationSchema, WebsiteSchema } from "@/components/structured-data";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://wheelsframes.com'),
  title: {
    default: 'Wheels Frames - Premium Die-Cast Model Cars Collection',
    template: '%s | Wheels Frames',
  },
  description: 'Discover premium die-cast model cars from Ferrari, Lamborghini, Porsche & more. High-quality collectible scale models with free shipping.',
  keywords: ['die-cast cars', 'model cars', 'collectible cars', 'Ferrari models', 'Lamborghini models', 'Porsche models', 'scale models', 'car collection'],
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
    locale: 'en_US',
    url: 'https://wheelsframes.com',
    siteName: 'Wheels Frames',
    title: 'Wheels Frames - Premium Die-Cast Model Cars Collection',
    description: 'Discover premium die-cast model cars from Ferrari, Lamborghini, Porsche & more.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Wheels Frames - Premium Die-Cast Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wheels Frames - Premium Die-Cast Model Cars',
    description: 'Discover premium die-cast model cars from Ferrari, Lamborghini, Porsche & more.',
    images: ['/og-image.jpg'],
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
    icon: '/icon.png',
    apple: '/apple-icon.png',
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
