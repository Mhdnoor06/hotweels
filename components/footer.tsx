"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Instagram } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"

const footerLinks = {
  quickLinks: [
    { name: "Collection", href: "/collection" },
    { name: "Wishlist", href: "/wishlist" },
    { name: "Orders", href: "/orders" },
    { name: "Contact", href: "/contact" },
  ],
}

export default function Footer() {
  const [email, setEmail] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const [adminClickCount, setAdminClickCount] = useState(0)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Hide footer on admin pages, login, and signup pages
  if (pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/signup') {
    return null
  }

  // Handle admin access click
  const handleAdminClick = () => {
    const newCount = adminClickCount + 1
    setAdminClickCount(newCount)

    // Clear existing timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }

    // If 4 clicks reached, redirect to admin
    if (newCount >= 4) {
      router.push('/admin')
      setAdminClickCount(0)
    } else {
      // Reset count after 3 seconds if not completed
      resetTimeoutRef.current = setTimeout(() => {
        setAdminClickCount(0)
      }, 3000)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  return (
    <footer className="bg-gray-950 text-white pt-20 pb-8 px-8 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Admin access button - small dot in top-right corner */}
      <button
        onClick={handleAdminClick}
        className="fixed bottom-4 right-4 w-2 h-2 bg-gray-600 hover:bg-gray-500 rounded-full cursor-pointer z-50 transition-colors"
        aria-label="Admin access"
        title=""
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16 pb-16 border-b border-white/10"
        >
          <h3 className="text-3xl md:text-4xl font-black tracking-tight">JOIN THE FAST LANE</h3>
          <p className="text-gray-400 mt-3 max-w-md mx-auto">
            Subscribe for exclusive releases, collector news, and special offers.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              Subscribe
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </motion.div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Image 
              src="/logo.png" 
              alt="Wheels Frams" 
              width={150} 
              height={150}
              className="h-16 w-auto object-contain mb-4"
              priority
            />
            <p className="text-gray-500 text-sm mt-4 leading-relaxed">Fueling the spirit of competition since 1968.</p>

            {/* Instagram */}
            <div className="mt-6">
              <motion.a
                href="https://www.instagram.com/wheelsframes?igsh=MW1iNGl2czE3eWRj"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors inline-flex"
              >
                <Instagram size={18} />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-500 hover:text-white transition-colors duration-200 text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 relative"
        >
          <div className="flex flex-col gap-1">
            <p className="text-gray-600 text-sm">© 2025 Wheels Frams. All rights reserved.</p>
            <p className="text-gray-600 text-xs">
              Developed by{" "}
              <a
                href="https://www.instagram.com/mohammed_noor_mn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors underline"
              >
                Noor Mohammed
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
