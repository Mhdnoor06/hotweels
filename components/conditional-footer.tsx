"use client"

import { usePathname } from "next/navigation"
import Footer from "@/components/footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Show footer only on home page and collection page
  const pagesWithFooter = ["/", "/collection"]
  
  if (pagesWithFooter.includes(pathname)) {
    return <Footer />
  }
  
  return null
}

