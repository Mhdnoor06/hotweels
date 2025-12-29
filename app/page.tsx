import { Metadata } from "next"
import dynamic from "next/dynamic"
import WheelsFramsHero from "../components/hero";
import { MobileCartBar } from "@/components/mobile-cart-bar";
import { FAQSchema, LocalBusinessSchema } from "@/components/structured-data";

// Dynamically import FeaturedCollection (below the fold) to reduce initial bundle
const FeaturedCollection = dynamic(
  () => import("../components/featured-collection"),
  {
    loading: () => (
      <div className="py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

export const metadata: Metadata = {
  title: 'Wheels Frames - Premium Die-Cast Model Cars | Ferrari, Lamborghini, Porsche',
  description: "India's finest collection of premium die-cast model cars. Shop authentic scale models from Ferrari, Lamborghini, Porsche, Mercedes-Benz & more. Free shipping on orders over ₹999.",
  alternates: {
    canonical: 'https://wheelsframes.com',
  },
}

export default function Home() {
  return (
    <main>
      <FAQSchema />
      <LocalBusinessSchema />
      <WheelsFramsHero />
      <FeaturedCollection />
      {/* Mobile Cart Bar */}
      <MobileCartBar />
      {/* Bottom padding for mobile cart bar */}
      <div className="h-20 sm:hidden" />
    </main>
  );
}
