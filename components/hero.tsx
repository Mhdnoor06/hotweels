"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import gsap from "gsap"

// Floating particle component
function FloatingParticle({ index }: { index: number }) {
  const particleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!particleRef.current) return

    const startX = Math.random() * 100
    const startY = Math.random() * 100

    gsap.set(particleRef.current, {
      left: `${startX}%`,
      top: `${startY}%`,
      opacity: 0,
    })

    gsap.to(particleRef.current, {
      y: -200 - Math.random() * 200,
      x: (Math.random() - 0.5) * 100,
      opacity: 0.6,
      duration: 3 + Math.random() * 2,
      delay: index * 0.2,
      repeat: -1,
      ease: "none",
      yoyo: false,
      repeatDelay: Math.random() * 2,
    })
  }, [index])

  return (
    <div
      ref={particleRef}
      className="absolute w-1 h-1 rounded-full bg-red-500/60"
      style={{ boxShadow: "0 0 8px 2px rgba(239, 68, 68, 0.4)" }}
    />
  )
}

export default function HotWheelsHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const carContainerRef = useRef<HTMLDivElement>(null)
  const hotWheelsTextRef = useRef<HTMLDivElement>(null)
  const frontWheelRef = useRef<HTMLDivElement>(null)
  const backWheelRef = useRef<HTMLDivElement>(null)
  const speedLinesRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const cursorGlowRef = useRef<HTMLDivElement>(null)
  const speedometerRef = useRef<HTMLDivElement>(null)
  const needleRef = useRef<SVGGElement>(null)
  const speedDisplayRef = useRef<HTMLDivElement>(null)
  const odometerTextRef = useRef<SVGTextElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const rightPanelBgRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [speed, setSpeed] = useState(0)
  const [odometer, setOdometer] = useState("0035000")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentCarIndex, setCurrentCarIndex] = useState(0)

  // Car data with specific wheel positions and colors for each car
  const cars = [
    {
      name: "Ferrari",
      model: "SF90 Stradale",
      image: "/ferrari/carbody.png",
      frontWheel: "/ferrari/frontweel.png",
      backWheel: "/ferrari/rareweel.png",
      logo: "/logo/ferrari.png",
      color: "#dc2626", // Red for Ferrari
      wheelPositions: {
        front: { bottom: "13%", left: "20%", width: "15%" },
        back: { bottom: "17.5%", right: "10%", width: "15%" }
      },
      specs: {
        topSpeed: "340",
        acceleration: "2.5",
        power: "1000",
        torque: "800"
      }
    },
    {
      name: "Lamborghini",
      model: "Huracán EVO",
      image: "/lamborgini/body.png",
      frontWheel: "/lamborgini/wheel.png",
      backWheel: "/lamborgini/rareweel.png",
      logo: "/logo/lamborghini.png",
      color: "#74C365", // Green for Lamborghini
      wheelPositions: {
        front: { bottom: "31%", left: "18%", width: "15%" },
        back: { bottom: "32%", right: "12%", width: "15%" }
      },
      specs: {
        topSpeed: "325",
        acceleration: "2.9",
        power: "640",
        torque: "600"
      }
    },
    {
      name: "Porsche",
      model: "911 GT3 RS",
      image: "/porche/body.png",
      frontWheel: "/porche/frontweel.png",
      backWheel: "/porche/rareweel.png",
      logo: "/logo/porsche.png",
      color: "#0055A4", // Blue for Porsche
      wheelPositions: {
        front: { bottom: "-8%", left: "17%", width: "16%" },
        back: { bottom: "-3%", right: "17%", width: "16%" }
      },
      specs: {
        topSpeed: "312",
        acceleration: "3.2",
        power: "525",
        torque: "465"
      }
    },
  ]

  // Speedometer configuration
  const minSpeed = 0
  const maxSpeed = 320
  const startAngle = 135
  const endAngle = 405
  const tickCount = 16

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Change car function with roll-in animation
  const changeCar = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next'
      ? (currentCarIndex + 1) % cars.length
      : (currentCarIndex - 1 + cars.length) % cars.length

    // Animate color change for right panel
    if (rightPanelBgRef.current) {
      gsap.to(rightPanelBgRef.current, {
        background: `linear-gradient(to bottom, ${cars[newIndex].color}, ${adjustColor(cars[newIndex].color, -20)}, ${adjustColor(cars[newIndex].color, -40)})`,
        duration: 0.8,
        ease: 'power2.inOut',
      })
    }

    // Animate wheels spinning while car exits
    gsap.to([frontWheelRef.current, backWheelRef.current], {
      rotation: direction === 'next' ? '-=360' : '+=360',
      duration: 0.6,
      ease: 'power2.in',
    })

    // Animate car out
    gsap.to(carContainerRef.current, {
      x: direction === 'next' ? '-120%' : '220%',
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        setCurrentCarIndex(newIndex)

        // Set new car position off screen
        gsap.set(carContainerRef.current, { x: direction === 'next' ? '120%' : '-120%', opacity: 0 })

        // Animate new car rolling in
        gsap.to(carContainerRef.current, {
          x: '0%',
          opacity: 1,
          duration: 1.2,
          ease: 'power2.out',
        })

        // Animate wheels spinning while new car enters
        gsap.to([frontWheelRef.current, backWheelRef.current], {
          rotation: direction === 'next' ? '-=1080' : '+=1080',
          duration: 1.2,
          ease: 'power2.out',
        })
      }
    })
  }

  // Helper function to darken color
  const adjustColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1)
  }

  // Convert speed to angle
  const speedToAngle = (spd: number) => {
    const range = endAngle - startAngle
    const speedRange = maxSpeed - minSpeed
    return startAngle + (spd / speedRange) * range
  }

  // Generate major tick marks
  const generateMajorTicks = () => {
    const ticks = []
    for (let i = 0; i <= tickCount; i++) {
      const speedValue = (i * maxSpeed) / tickCount
      const angle = speedToAngle(speedValue)
      const radian = (angle * Math.PI) / 180

      const innerRadius = 130
      const outerRadius = 155
      const textRadius = 110

      const x1 = Math.round((200 + innerRadius * Math.cos(radian)) * 100) / 100
      const y1 = Math.round((200 + innerRadius * Math.sin(radian)) * 100) / 100
      const x2 = Math.round((200 + outerRadius * Math.cos(radian)) * 100) / 100
      const y2 = Math.round((200 + outerRadius * Math.sin(radian)) * 100) / 100
      const textX = Math.round((200 + textRadius * Math.cos(radian)) * 100) / 100
      const textY = Math.round((200 + textRadius * Math.sin(radian)) * 100) / 100

      const isRedZone = speedValue >= 280

      ticks.push(
        <g key={`major-${i}`}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isRedZone ? "#e53935" : "#1a1a1a"}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
          <text
            x={textX}
            y={textY}
            fill={isRedZone ? "#e53935" : "#1a1a1a"}
            opacity="0.9"
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Arial, sans-serif"
          >
            {Math.round(speedValue)}
          </text>
        </g>,
      )
    }
    return ticks
  }

  // Generate minor tick marks
  const generateMinorTicks = () => {
    const ticks = []
    const totalMinorTicks = tickCount * 4

    for (let i = 0; i <= totalMinorTicks; i++) {
      if (i % 4 === 0) continue

      const speedValue = (i * maxSpeed) / totalMinorTicks
      const angle = speedToAngle(speedValue)
      const radian = (angle * Math.PI) / 180

      const innerRadius = 140
      const outerRadius = 155

      const x1 = Math.round((200 + innerRadius * Math.cos(radian)) * 100) / 100
      const y1 = Math.round((200 + innerRadius * Math.sin(radian)) * 100) / 100
      const x2 = Math.round((200 + outerRadius * Math.cos(radian)) * 100) / 100
      const y2 = Math.round((200 + outerRadius * Math.sin(radian)) * 100) / 100

      const isRedZone = speedValue >= 280

      ticks.push(
        <line
          key={`minor-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isRedZone ? "#e53935" : "#1a1a1a"}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />,
      )
    }
    return ticks
  }

  // Mouse tracking for glow effect (desktop only)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return
      
      setMousePos({ x: e.clientX, y: e.clientY })
      if (cursorGlowRef.current) {
        gsap.to(cursorGlowRef.current, {
          x: e.clientX - 150,
          y: e.clientY - 150,
          duration: 0.3,
          ease: "power2.out",
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isMobile])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial positions
      gsap.set(leftPanelRef.current, { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" })
      gsap.set(rightPanelRef.current, { y: isMobile ? '100%' : '-100%', opacity: 0 })
      gsap.set(carContainerRef.current, { x: "120%", opacity: 0, scale: 0.8, rotateY: 15 })
      gsap.set(hotWheelsTextRef.current, { y: -100, opacity: 0, scale: 0.5 })
      gsap.set([frontWheelRef.current, backWheelRef.current], { rotation: 0 })
      gsap.set(speedLinesRef.current, { opacity: 0, x: 100 })
      gsap.set(glowRef.current, { opacity: 0, scale: 0.5 })
      gsap.set(titleRef.current, { y: 60, opacity: 0 })
      gsap.set(subtitleRef.current, { y: 40, opacity: 0 })
      gsap.set(statsRef.current, { y: 30, opacity: 0 })
      gsap.set(navRef.current, { y: -50, opacity: 0 })
      gsap.set(speedometerRef.current, { scale: 0.8, opacity: 0, y: -20 })
      gsap.set(logoRef.current, { rotateY: 0, opacity: 0 })
      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${startAngle}deg)`
        needleRef.current.style.transformOrigin = "200px 200px"
      }

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } })

      // Epic entrance sequence
      tl.to(navRef.current, { y: 0, opacity: 1, duration: 0.8 })
        .to(
          leftPanelRef.current,
          {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            duration: 1.2,
          },
          "-=0.4",
        )
        .to(
          rightPanelRef.current,
          {
            y: '0%',
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
          },
          "-=1",
        )
        .to(
          titleRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.8",
        )
        .to(
          subtitleRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
          },
          "-=0.6",
        )
        .to(
          logoRef.current,
          {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.6",
        )
        .to(
          statsRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
          },
          "-=0.5",
        )
        .to(
          hotWheelsTextRef.current,
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "back.out(1.7)",
          },
          "-=0.6",
        )
        .to(
          glowRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
          },
          "-=0.4",
        )
        .to(
          carContainerRef.current,
          {
            x: "0%",
            opacity: 1,
            scale: 1,
            rotateY: 0,
            duration: 1.6,
            ease: "power4.out",
          },
          "-=0.3",
        )
        .to(
          [frontWheelRef.current, backWheelRef.current],
          {
            rotation: -1440,
            duration: 1.6,
            ease: "power4.out",
          },
          "<",
        )
        .to(
          speedLinesRef.current,
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
          },
          "-=1.2",
        )
        .to(
          speedometerRef.current,
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "-=0.5",
        )
        .to(
          { speedValue: 0 },
          {
            speedValue: 300,
            duration: 2,
            ease: "power2.out",
            onUpdate: function () {
              const currentSpeed = Math.round(this.targets()[0].speedValue)
              setSpeed(currentSpeed)
              if (speedDisplayRef.current) {
                speedDisplayRef.current.textContent = currentSpeed.toString()
              }
              if (needleRef.current) {
                const angle = speedToAngle(currentSpeed)
                needleRef.current.style.transform = `rotate(${angle}deg)`
                needleRef.current.style.transformOrigin = "200px 200px"
              }
            },
          },
          "-=1.5",
        )
        .to(
          { value: 35000 },
          {
            value: 36000,
            duration: 2,
            ease: "power1.inOut",
            onUpdate: function () {
              const val = Math.floor(this.targets()[0].value)
              const odometerStr = val.toString().padStart(7, "0")
              setOdometer(odometerStr)
              if (odometerTextRef.current) {
                odometerTextRef.current.textContent = odometerStr
              }
            },
          },
          "<",
        )
        .to(
          { speedValue: 300 },
          {
            speedValue: 280,
            duration: 1.5,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
            onUpdate: function () {
              const currentSpeed = Math.round(this.targets()[0].speedValue)
              setSpeed(currentSpeed)
              if (speedDisplayRef.current) {
                speedDisplayRef.current.textContent = currentSpeed.toString()
              }
              if (needleRef.current) {
                const angle = speedToAngle(currentSpeed)
                needleRef.current.style.transform = `rotate(${angle}deg)`
                needleRef.current.style.transformOrigin = "200px 200px"
              }
            },
          },
          ">",
        )
        .to(logoRef.current, {
          rotateY: 360,
          duration: 8,
          ease: "none",
          repeat: -1,
        }, "-=2")
        .to(
          glowRef.current,
          {
            scale: 1.1,
            opacity: 0.8,
            duration: 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          "<",
        )

    }, containerRef)

    return () => ctx.revert()
  }, [isMobile])

  return (
    <section ref={containerRef} className="min-h-screen flex flex-col-reverse lg:flex-row overflow-hidden bg-gray-100 relative">
      {/* Cursor glow effect - Desktop only */}
      <div
        ref={cursorGlowRef}
        className="hidden lg:block fixed w-[300px] h-[300px] pointer-events-none z-50 opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(60,60,60,0.3) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Navigation */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-6 bg-gray-100/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none">
        <div className="text-black font-black text-lg sm:text-xl tracking-tighter drop-shadow-lg">HW</div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <Link
            href="/collection"
            className="text-white font-semibold text-sm hover:text-white/80 transition-colors duration-300 relative group drop-shadow-lg"
          >
            Collection
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            href="/wishlist"
            className="text-white font-semibold text-sm hover:text-white/80 transition-colors duration-300 relative group drop-shadow-lg"
          >
            Wishlist
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            href="/orders"
            className="text-white font-semibold text-sm hover:text-white/80 transition-colors duration-300 relative group drop-shadow-lg"
          >
            Orders
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/collection">
            <button
              className="px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: 'white',
                color: cars[currentCarIndex].color
              }}
            >
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden z-50 relative w-8 h-8 flex flex-col justify-center items-center gap-1.5"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {/* Mobile Menu */}
        <div
          ref={mobileMenuRef}
          className={`lg:hidden fixed inset-0 bg-gray-900/95 backdrop-blur-lg z-40 transition-all duration-300 ${
            isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <Link
              href="/collection"
              className="text-white text-2xl font-bold hover:opacity-80 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Collection
            </Link>
            <Link
              href="/wishlist"
              className="text-white text-2xl font-bold hover:opacity-80 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Wishlist
            </Link>
            <Link
              href="/orders"
              className="text-white text-2xl font-bold hover:opacity-80 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Orders
            </Link>
            <Link href="/collection" onClick={() => setIsMobileMenuOpen(false)}>
              <button
                className="px-8 py-3 text-lg font-bold rounded-full transition-all duration-300"
                style={{
                  backgroundColor: 'white',
                  color: cars[currentCarIndex].color
                }}
              >
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Left Section */}
      <div
        ref={leftPanelRef}
        className="flex-1 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 relative flex flex-col items-center justify-center overflow-hidden min-h-[60vh] lg:min-h-screen"
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: isMobile ? 8 : 15 }).map((_, i) => (
            <FloatingParticle key={i} index={i} />
          ))}
        </div>

        {/* Central glow */}
        <div
          ref={glowRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(150,150,150,0.3) 0%, rgba(150,150,150,0.1) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Speedometer */}
        <div ref={speedometerRef} className="absolute top-12 sm:top-20 lg:top-48 left-4 sm:left-6 lg:left-8 z-30">
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 400 400" className="sm:w-[140px] sm:h-[140px] lg:w-[160px] lg:h-[160px]">
              {generateMinorTicks()}
              {generateMajorTicks()}

              {/* Odometer display */}
              <rect x="145" y="130" width="110" height="24" rx="3" fill="rgba(26, 26, 26, 0.7)" />
              <text
                ref={odometerTextRef}
                x="200"
                y="145"
                fill="#00ff00"
                fontSize="14"
                fontFamily="'Courier New', monospace"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="bold"
                opacity="0.9"
              >
                {odometer}
              </text>

              {/* km/h label */}
              <text
                x="200"
                y="260"
                fill="#1a1a1a"
                fontSize="16"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                opacity="0.9"
              >
                km/h
              </text>

              {/* Center circles */}
              <circle cx="200" cy="200" r="20" fill="rgba(26, 26, 26, 0.7)" />
              <circle cx="200" cy="200" r="18" fill="rgba(13, 13, 13, 0.7)" />
              <circle cx="200" cy="200" r="6" fill="rgba(42, 42, 42, 0.7)" />
              <circle cx="200" cy="200" r="3" fill="rgba(58, 58, 58, 0.7)" />

              {/* Needle */}
              <g ref={needleRef}>
                <polygon points="200,50 190,200 210,200" fill="#d32f2f" />
              </g>
            </svg>

            {/* Current speed display */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <div ref={speedDisplayRef} className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
                {speed}
              </div>
            </div>
          </div>
        </div>

        {/* HOT WHEELS Logo */}
        <div ref={hotWheelsTextRef} className="absolute top-16 sm:top-20 lg:top-24 left-1/2 -translate-x-1/2 z-20 px-4 text-center">
          <span
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text tracking-tighter transition-all duration-500"
            style={{
              backgroundImage: `linear-gradient(to right, ${cars[currentCarIndex].color}, ${adjustColor(cars[currentCarIndex].color, 20)}, ${cars[currentCarIndex].color})`
            }}
          >
            HOT WHEELS
          </span>
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 tracking-[0.2em] sm:tracking-[0.3em] uppercase">Since 1968</p>
        </div>

        {/* Speed lines */}
        <div
          ref={speedLinesRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-48 sm:h-56 lg:h-64 pointer-events-none overflow-hidden"
        >
          {Array.from({ length: isMobile ? 5 : 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-0.5 bg-gradient-to-r from-gray-400/60 to-transparent"
              style={{
                top: `${20 + i * 10}%`,
                left: "-10%",
                width: `${30 + Math.random() * 20}%`,
                opacity: 0.3 + Math.random() * 0.3,
              }}
            />
          ))}
        </div>

        {/* Car Section */}
        <div className="flex-1 flex items-center justify-center w-full relative mt-12 sm:mt-16 lg:mt-20 px-4">
          {/* Navigation Arrows - Positioned on the sides */}
          <button
            onClick={() => changeCar('prev')}
            className="absolute left-4 sm:left-6 lg:left-12 top-1/2 -translate-y-1/2 z-40 group opacity-40 hover:opacity-100 transition-opacity duration-300"
            aria-label="Previous car"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-gray-400/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:border-gray-900 group-hover:bg-white/10">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => changeCar('next')}
            className="absolute right-4 sm:right-6 lg:right-12 top-1/2 -translate-y-1/2 z-40 group opacity-40 hover:opacity-100 transition-opacity duration-300"
            aria-label="Next car"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-gray-400/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:border-gray-900 group-hover:bg-white/10">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <div
            ref={carContainerRef}
            className="relative w-full max-w-[280px] sm:max-w-lg md:max-w-2xl lg:max-w-4xl h-full flex items-center justify-center"
            style={{ perspective: "1000px" }}
          >
            {/* Ground shadow - positioned at wheel contact points */}
            <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-[70%] h-8 sm:h-10 lg:h-12 bg-black/40 blur-2xl lg:blur-3xl rounded-[100%] z-0" />
            <div className="absolute bottom-[28.5%] left-1/2 -translate-x-1/2 w-[60%] h-6 sm:h-7 lg:h-8 bg-black/50 blur-xl lg:blur-2xl rounded-[100%] z-0" />
            <div className="absolute bottom-[29%] left-1/2 -translate-x-1/2 w-[50%] h-3 sm:h-3.5 lg:h-4 bg-black/60 blur-lg lg:blur-xl rounded-[100%] z-0" />

            {/* Car Body - Wrapper for precise wheel positioning */}
            <div className="relative w-full">
              <Image
                src={cars[currentCarIndex].image}
                alt={`Hot Wheels ${cars[currentCarIndex].name}`}
                width={1200}
                height={800}
                className="object-contain w-full h-auto relative z-10 drop-shadow-2xl"
                style={{
                  filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
                }}
                priority
                quality={95}
              />

              {/* Back Wheel - Positioned relative to car body */}
              <div
                ref={backWheelRef}
                className="absolute z-20 aspect-square flex items-center justify-center"
                style={{
                  bottom: cars[currentCarIndex].wheelPositions.back.bottom,
                  right: cars[currentCarIndex].wheelPositions.back.right,
                  width: cars[currentCarIndex].wheelPositions.back.width,
                }}
              >
                <Image
                  src={cars[currentCarIndex].backWheel}
                  alt="Back Wheel"
                  width={200}
                  height={200}
                  className="object-contain w-full h-full"
                  style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))" }}
                />
              </div>

              {/* Front Wheel - Positioned relative to car body */}
              <div
                ref={frontWheelRef}
                className="absolute z-20 aspect-square flex items-center justify-center"
                style={{
                  bottom: cars[currentCarIndex].wheelPositions.front.bottom,
                  left: cars[currentCarIndex].wheelPositions.front.left,
                  width: cars[currentCarIndex].wheelPositions.front.width,
                }}
              >
                <Image
                  src={cars[currentCarIndex].frontWheel}
                  alt="Front Wheel"
                  width={200}
                  height={200}
                  className="object-contain w-full h-full"
                  style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="absolute bottom-6 sm:bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2">
          <button className="group relative px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 bg-transparent border-2 border-red-500 text-gray-900 font-bold text-xs sm:text-sm rounded-full overflow-hidden transition-all duration-500 hover:border-red-400">
            <span className="relative z-10 group-hover:text-white transition-colors duration-500">
              EXPLORE COLLECTION
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div
        ref={rightPanelRef}
        className="w-full lg:w-[450px] relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-12 min-h-[40vh] lg:min-h-screen"
      >
        {/* Dynamic color background */}
        <div
          ref={rightPanelBgRef}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${cars[currentCarIndex].color}, ${adjustColor(cars[currentCarIndex].color, -20)}, ${adjustColor(cars[currentCarIndex].color, -40)})`,
          }}
        />
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 bg-yellow-500/10 rounded-full blur-2xl" />
        </div>

        {/* Diagonal lines pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, white 0, white 1px, transparent 1px, transparent 20px)`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
            <span className="text-white/60 text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase">{cars[currentCarIndex].name}</span>
            <div className="w-10 sm:w-12 h-0.5 sm:h-1 bg-white/30 rounded-full" />
          </div>

          <h2 ref={titleRef} className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4 sm:mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              {cars[currentCarIndex].model}
            </span>
          </h2>

          <p ref={subtitleRef} className="text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed max-w-sm mb-6 sm:mb-8">
            Experience pure automotive excellence. Engineered for speed, designed for perfection.
          </p>

          {/* Car Brand Logo */}
          <div className="mb-6 sm:mb-8 flex justify-center" style={{ perspective: '1000px' }}>
            <div ref={logoRef} style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}>
              <Image
                src={cars[currentCarIndex].logo}
                alt={`${cars[currentCarIndex].name} Logo`}
                width={280}
                height={120}
                className="object-contain h-24 sm:h-28 lg:h-32 w-auto"
                priority
                style={{ display: 'block' }}
              />
            </div>
          </div>

          {/* Car Specifications */}
          <div ref={statsRef} className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">Top Speed</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{cars[currentCarIndex].specs.topSpeed}</div>
              <div className="text-xs text-white/40 mt-0.5">km/h</div>
            </div>
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">0-100 km/h</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{cars[currentCarIndex].specs.acceleration}</div>
              <div className="text-xs text-white/40 mt-0.5">seconds</div>
            </div>
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">Power</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{cars[currentCarIndex].specs.power}</div>
              <div className="text-xs text-white/40 mt-0.5">HP</div>
            </div>
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">Torque</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{cars[currentCarIndex].specs.torque}</div>
              <div className="text-xs text-white/40 mt-0.5">Nm</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}