import WheelsFramsHero from "../components/hero";
import FeaturedCollection from "../components/featured-collection";
import { MobileCartBar } from "@/components/mobile-cart-bar";

export default function Home() {
  return (
    <main>
      <WheelsFramsHero />
      <FeaturedCollection />
      {/* Mobile Cart Bar */}
      <MobileCartBar />
      {/* Bottom padding for mobile cart bar */}
      <div className="h-20 sm:hidden" />
    </main>
  );
}
