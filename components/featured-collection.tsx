"use client"

import { motion } from "framer-motion"
import { ProductRevealCard } from "./product-reveal-card"
import Link from "next/link"

const cars = [
  {
    id: 1,
    name: "Twin Mill III",
    series: "HW Dream Garage",
    price: "$12.99",
    originalPrice: "$19.99",
    image: "/hw/red-hot-wheels-twin-mill-car.jpg",
    description: "Iconic dual-engine Hot Wheels design. Features chrome details and premium die-cast construction. A must-have for collectors.",
    rating: 4.9,
    reviewCount: 234,
  },
  {
    id: 2,
    name: "Bone Shaker",
    series: "HW Legends",
    price: "$14.99",
    originalPrice: "$21.99",
    image: "/hw/black-hot-wheels-bone-shaker-car.jpg",
    description: "Street rod inspired design with exposed engine and custom paint. Premium Hot Wheels craftsmanship with authentic details.",
    rating: 4.8,
    reviewCount: 189,
  },
  {
    id: 3,
    name: "Deora II",
    series: "HW Originals",
    price: "$11.99",
    originalPrice: "$17.99",
    image: "/hw/orange-hot-wheels-deora-car.jpg",
    description: "Futuristic pickup truck design based on the legendary Deora concept. Sleek aerodynamic body with opening features.",
    rating: 4.7,
    reviewCount: 156,
  },
  {
    id: 4,
    name: "Rodger Dodger",
    series: "HW Muscle Mania",
    price: "$13.99",
    originalPrice: "$18.99",
    image: "/hw/blue-hot-wheels-rodger-dodger-muscle-car.jpg",
    description: "Classic muscle car styling with powerful stance. Features authentic Hot Wheels Real Riders wheels and premium finish.",
    rating: 4.8,
    reviewCount: 198,
  },
]

export default function FeaturedCollection() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-orange-500 text-xs sm:text-sm font-bold tracking-[0.25em] sm:tracking-[0.3em] uppercase">
            Premium Selection
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mt-3 sm:mt-4 tracking-tight">
            THE GARAGE
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-3 sm:mt-4 max-w-md mx-auto px-4">
            Explore our handpicked collection of legendary Hot Wheels models
          </p>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 lg:gap-8 justify-items-center">
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: index * 0.1,
              }}
            >
              <ProductRevealCard
                name={car.name}
                price={car.price}
                originalPrice={car.originalPrice}
                image={car.image}
                description={car.description}
                rating={car.rating}
                reviewCount={car.reviewCount}
                onAdd={() => console.log(`Added ${car.name} to cart`)}
                onFavorite={() => console.log(`Favorited ${car.name}`)}
              />
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <Link href="/collection">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 sm:py-3.5 bg-gray-900 text-white text-sm sm:text-base font-bold rounded-full hover:bg-gray-800 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              View Full Collection
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
