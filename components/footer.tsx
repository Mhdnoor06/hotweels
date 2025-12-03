"use client"

import { motion } from "framer-motion"
import { ArrowRight, Facebook, Instagram, Twitter, Youtube } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"

const footerLinks = {
  shop: ["New Arrivals", "Best Sellers", "Limited Editions", "Collector Sets"],
  about: ["Our Story", "Careers", "Press", "Contact"],
  support: ["FAQ", "Shipping", "Returns", "Track Order"],
}

export default function Footer() {
  const [email, setEmail] = useState("")
  const pathname = usePathname()

  // Hide footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

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
            <span className="text-2xl font-black tracking-tighter">
              HOT<span className="text-red-500">WHEELS</span>
            </span>
            <p className="text-gray-500 text-sm mt-4 leading-relaxed">Fueling the spirit of competition since 1968.</p>

            {/* Social Icons */}
            <div className="flex gap-4 mt-6">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links], colIndex) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (colIndex + 1) * 0.1 }}
            >
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200 text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-600 text-sm">© 2025 Hot Wheels. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookies
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
