import { Metadata } from "next"
import WheelsFramsHero from "../components/hero";
import FeaturedCollection from "../components/featured-collection";
import { MobileCartBar } from "@/components/mobile-cart-bar";
import { FAQSchema, LocalBusinessSchema } from "@/components/structured-data";

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
