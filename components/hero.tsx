"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { useAuth } from "@/context/auth-context"

// Car data moved outside component to prevent recreation on every render
const CARS_DATA = [
  {
    name: "Ferrari",
    model: "SF90 Stradale",
    image: "/ferrari/carbody.webp",
    frontWheel: "/ferrari/frontweel.webp",
    backWheel: "/ferrari/rareweel.webp",
    logo: "/logo/ferrari.png",
    color: "#dc2626",
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
    image: "/lamborgini/body.webp",
    frontWheel: "/lamborgini/wheel.webp",
    backWheel: "/lamborgini/rareweel.webp",
    logo: "/logo/lamborghini.png",
    color: "#74C365",
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
    image: "/porche/body.webp",
    frontWheel: "/porche/frontweel.webp",
    backWheel: "/porche/rareweel.webp",
    logo: "/logo/porsche.png",
    color: "#0055A4",
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

// Helper function to darken/lighten color - moved outside component
const adjustColor = (color: string, percent: number): string => {
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

// Speedometer configuration - moved outside component
const SPEEDOMETER_CONFIG = {
  minSpeed: 0,
  maxSpeed: 320,
  startAngle: 135,
  endAngle: 405,
  tickCount: 16,
}

// Convert speed to angle - moved outside component
const speedToAngle = (spd: number): number => {
  const { startAngle, endAngle, maxSpeed, minSpeed } = SPEEDOMETER_CONFIG
  const range = endAngle - startAngle
  const speedRange = maxSpeed - minSpeed
  return startAngle + (spd / speedRange) * range
}

// Pre-generate tick data outside component
const generateTickData = () => {
  const { tickCount, maxSpeed } = SPEEDOMETER_CONFIG
  const majorTicks: Array<{
    speedValue: number
    angle: number
    x1: number
    y1: number
    x2: number
    y2: number
    textX: number
    textY: number
    isRedZone: boolean
  }> = []
  const minorTicks: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    isRedZone: boolean
  }> = []

  // Major ticks
  for (let i = 0; i <= tickCount; i++) {
    const speedValue = (i * maxSpeed) / tickCount
    const angle = speedToAngle(speedValue)
    const radian = (angle * Math.PI) / 180

    const innerRadius = 130
    const outerRadius = 155
    const textRadius = 110

    majorTicks.push({
      speedValue,
      angle,
      x1: Math.round((200 + innerRadius * Math.cos(radian)) * 100) / 100,
      y1: Math.round((200 + innerRadius * Math.sin(radian)) * 100) / 100,
      x2: Math.round((200 + outerRadius * Math.cos(radian)) * 100) / 100,
      y2: Math.round((200 + outerRadius * Math.sin(radian)) * 100) / 100,
      textX: Math.round((200 + textRadius * Math.cos(radian)) * 100) / 100,
      textY: Math.round((200 + textRadius * Math.sin(radian)) * 100) / 100,
      isRedZone: speedValue >= 280,
    })
  }

  // Minor ticks
  const totalMinorTicks = tickCount * 4
  for (let i = 0; i <= totalMinorTicks; i++) {
    if (i % 4 === 0) continue

    const speedValue = (i * maxSpeed) / totalMinorTicks
    const angle = speedToAngle(speedValue)
    const radian = (angle * Math.PI) / 180

    const innerRadius = 140
    const outerRadius = 155

    minorTicks.push({
      x1: Math.round((200 + innerRadius * Math.cos(radian)) * 100) / 100,
      y1: Math.round((200 + innerRadius * Math.sin(radian)) * 100) / 100,
      x2: Math.round((200 + outerRadius * Math.cos(radian)) * 100) / 100,
      y2: Math.round((200 + outerRadius * Math.sin(radian)) * 100) / 100,
      isRedZone: speedValue >= 280,
    })
  }

  return { majorTicks, minorTicks }
}

const TICK_DATA = generateTickData()

// Pre-generate particle animation configs
const generateParticleConfigs = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    startX: Math.random() * 100,
    startY: Math.random() * 100,
    yOffset: -200 - Math.random() * 200,
    xOffset: (Math.random() - 0.5) * 100,
    duration: 3 + Math.random() * 2,
    repeatDelay: Math.random() * 2,
  }))
}

const PARTICLE_CONFIGS_MOBILE = generateParticleConfigs(8)
const PARTICLE_CONFIGS_DESKTOP = generateParticleConfigs(15)

// Pre-generate speed line configs
const generateSpeedLineConfigs = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    top: `${20 + i * 10}%`,
    width: `${30 + Math.random() * 20}%`,
    opacity: 0.3 + Math.random() * 0.3,
  }))
}

const SPEED_LINES_MOBILE = generateSpeedLineConfigs(5)
const SPEED_LINES_DESKTOP = generateSpeedLineConfigs(8)

// Memoized Floating particle component
const FloatingParticle = memo(function FloatingParticle({
  index,
  config
}: {
  index: number
  config: { startX: number; startY: number; yOffset: number; xOffset: number; duration: number; repeatDelay: number }
}) {
  const particleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!particleRef.current) return

    gsap.set(particleRef.current, {
      left: `${config.startX}%`,
      top: `${config.startY}%`,
      opacity: 0,
    })

    const animation = gsap.to(particleRef.current, {
      y: config.yOffset,
      x: config.xOffset,
      opacity: 0.6,
      duration: config.duration,
      delay: index * 0.2,
      repeat: -1,
      ease: "none",
      yoyo: false,
      repeatDelay: config.repeatDelay,
    })

    return () => {
      animation.kill()
    }
  }, [index, config])

  return (
    <div
      ref={particleRef}
      className="absolute w-1 h-1 rounded-full bg-red-500/60"
      style={{ boxShadow: "0 0 8px 2px rgba(239, 68, 68, 0.4)" }}
    />
  )
})

export default function WheelsFramsHero() {
  const router = useRouter()
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const carContainerRef = useRef<HTMLDivElement>(null)
  const wheelsFramsTextRef = useRef<HTMLDivElement>(null)
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentCarIndex, setCurrentCarIndex] = useState(0)

  const handleGetStarted = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsMobileMenuOpen(false)
    router.push(user ? '/collection' : '/login')
  }, [user, router])

  // Memoize current car to prevent unnecessary re-renders
  const currentCar = CARS_DATA[currentCarIndex]

  // Pre-compute gradient values for current car
  const currentGradient = useMemo(() => ({
    background: `linear-gradient(to bottom, ${currentCar.color}, ${adjustColor(currentCar.color, -20)}, ${adjustColor(currentCar.color, -40)})`,
    text: `linear-gradient(to right, ${currentCar.color}, ${adjustColor(currentCar.color, 20)}, ${currentCar.color})`
  }), [currentCar.color])

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Change car function with roll-in animation - memoized with useCallback
  const changeCar = useCallback((direction: 'next' | 'prev') => {
    const newIndex = direction === 'next'
      ? (currentCarIndex + 1) % CARS_DATA.length
      : (currentCarIndex - 1 + CARS_DATA.length) % CARS_DATA.length

    const newCar = CARS_DATA[newIndex]

    // Animate color change for right panel
    if (rightPanelBgRef.current) {
      gsap.to(rightPanelBgRef.current, {
        background: `linear-gradient(to bottom, ${newCar.color}, ${adjustColor(newCar.color, -20)}, ${adjustColor(newCar.color, -40)})`,
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
  }, [currentCarIndex])

  // Memoized tick mark rendering
  const majorTickElements = useMemo(() =>
    TICK_DATA.majorTicks.map((tick, i) => (
      <g key={`major-${i}`}>
        <line
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={tick.isRedZone ? "#e53935" : "#1a1a1a"}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <text
          x={tick.textX}
          y={tick.textY}
          fill={tick.isRedZone ? "#e53935" : "#1a1a1a"}
          opacity="0.9"
          fontSize="14"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Arial, sans-serif"
        >
          {Math.round(tick.speedValue)}
        </text>
      </g>
    )), [])

  const minorTickElements = useMemo(() =>
    TICK_DATA.minorTicks.map((tick, i) => (
      <line
        key={`minor-${i}`}
        x1={tick.x1}
        y1={tick.y1}
        x2={tick.x2}
        y2={tick.y2}
        stroke={tick.isRedZone ? "#e53935" : "#1a1a1a"}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    )), [])

  // Mouse tracking for glow effect (desktop only) - with throttling
  useEffect(() => {
    if (isMobile) return

    let lastTime = 0
    const throttleMs = 16 // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastTime < throttleMs) return
      lastTime = now

      if (cursorGlowRef.current) {
        gsap.to(cursorGlowRef.current, {
          x: e.clientX - 150,
          y: e.clientY - 150,
          duration: 0.3,
          ease: "power2.out",
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isMobile])

  // Store initial mobile state to avoid animation restart on resize
  const initialIsMobileRef = useRef<boolean | null>(null)

  useEffect(() => {
    // Capture initial mobile state only once
    if (initialIsMobileRef.current === null) {
      initialIsMobileRef.current = window.innerWidth < 1024
    }

    const initialIsMobile = initialIsMobileRef.current

    const ctx = gsap.context(() => {
      // Set initial positions
      gsap.set(leftPanelRef.current, { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" })
      gsap.set(rightPanelRef.current, { y: initialIsMobile ? '100%' : '-100%', opacity: 0 })
      gsap.set(carContainerRef.current, { x: "120%", opacity: 0, scale: 0.8, rotateY: 15 })
      gsap.set(wheelsFramsTextRef.current, { y: -100, opacity: 0, scale: 0.5 })
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
        needleRef.current.style.transform = `rotate(${SPEEDOMETER_CONFIG.startAngle}deg)`
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
          wheelsFramsTextRef.current,
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
              // Update DOM directly via refs - no setState needed
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
              // Update DOM directly via ref - no setState needed
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
              // Update DOM directly via refs - no setState needed
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
  }, []) // Empty dependency - animation runs once on mount

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
        <div className="flex items-center gap-2 sm:gap-3">
          <Image 
            src="/darklogo.jpg" 
            alt="Wheels Frams Logo" 
            width={40} 
            height={40}
            className="h-8 sm:h-10 w-auto object-contain rounded-full"
            priority
          />
        </div>

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
                color: currentCar.color
              }}
            >
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`lg:hidden z-[70] relative w-10 h-10 flex flex-col justify-center items-center gap-1.5 rounded-full transition-colors ${
            isMobileMenuOpen ? 'bg-white/10' : ''
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300 origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 scale-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300 origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

      </nav>

      {/* Mobile Menu - Moved outside nav for proper full-screen coverage */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed inset-0 bg-gray-900/95 backdrop-blur-lg z-[60] transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={(e) => {
          // Close menu when clicking the backdrop
          if (e.target === e.currentTarget) {
            setIsMobileMenuOpen(false)
          }
        }}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center justify-center min-h-screen py-20 px-6 gap-5 overflow-y-auto">
          <Link
            href="/"
            className="text-white text-xl font-bold hover:text-white/80 transition-colors duration-300 py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/collection"
            className="text-white text-xl font-bold hover:text-white/80 transition-colors duration-300 py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Collection
          </Link>
          <Link
            href="/wishlist"
            className="text-white text-xl font-bold hover:text-white/80 transition-colors duration-300 py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Wishlist
          </Link>
          <Link
            href="/orders"
            className="text-white text-xl font-bold hover:text-white/80 transition-colors duration-300 py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Orders
          </Link>
          <Link
            href="/contact"
            className="text-white text-xl font-bold hover:text-white/80 transition-colors duration-300 py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </Link>

          <div className="w-16 h-0.5 bg-white/20 my-2" />

          <Link
            href="/collection"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-2"
          >
            <button
              className="px-8 py-3 text-base font-bold rounded-full transition-all duration-300 hover:scale-105 whitespace-nowrap"
              style={{
                backgroundColor: 'white',
                color: currentCar.color
              }}
            >
              Get Started
            </button>
          </Link>
        </div>
      </div>

      {/* Left Section */}
      <div
        ref={leftPanelRef}
        className="flex-1 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 relative flex flex-col items-center justify-center overflow-hidden min-h-[60vh] lg:min-h-screen pt-16 lg:pt-0"
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

        {/* Floating particles - using pre-computed configs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {(isMobile ? PARTICLE_CONFIGS_MOBILE : PARTICLE_CONFIGS_DESKTOP).map((config, i) => (
            <FloatingParticle key={i} index={i} config={config} />
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
        <div ref={speedometerRef} className="absolute top-20 sm:top-24 lg:top-48 left-4 sm:left-6 lg:left-8 z-30">
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 400 400" className="sm:w-[140px] sm:h-[140px] lg:w-[160px] lg:h-[160px]">
              {minorTickElements}
              {majorTickElements}

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
                0035000
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
                0
              </div>
            </div>
          </div>
        </div>

        {/* WHEELS FRAMS Logo */}
        <div ref={wheelsFramsTextRef} className="hidden lg:block absolute top-16 sm:top-20 lg:top-24 left-1/2 -translate-x-1/2 z-20 px-6 sm:px-8 md:px-12 text-center w-full max-w-full overflow-visible">
          <span
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text tracking-tighter transition-all duration-500 whitespace-nowrap inline-block"
            style={{ backgroundImage: currentGradient.text }}
          >
            WHEELS FRAMS
          </span>
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 tracking-[0.2em] sm:tracking-[0.3em] uppercase">Since 1968</p>
        </div>

        {/* Speed lines - using pre-computed configs */}
        <div
          ref={speedLinesRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-48 sm:h-56 lg:h-64 pointer-events-none overflow-hidden"
        >
          {(isMobile ? SPEED_LINES_MOBILE : SPEED_LINES_DESKTOP).map((config, i) => (
            <div
              key={i}
              className="absolute h-0.5 bg-gradient-to-r from-gray-400/60 to-transparent"
              style={{
                top: config.top,
                left: "-10%",
                width: config.width,
                opacity: config.opacity,
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
                src={currentCar.image}
                alt={`Wheels Frams ${currentCar.name}`}
                width={1200}
                height={800}
                sizes="(max-width: 640px) 280px, (max-width: 768px) 512px, (max-width: 1024px) 672px, 896px"
                className="object-contain w-full h-auto relative z-10 drop-shadow-2xl"
                style={{
                  filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.4))",
                }}
                priority
                quality={90}
              />

              {/* Back Wheel - Positioned relative to car body */}
              <div
                ref={backWheelRef}
                className="absolute z-20 aspect-square flex items-center justify-center"
                style={{
                  bottom: currentCar.wheelPositions.back.bottom,
                  right: currentCar.wheelPositions.back.right,
                  width: currentCar.wheelPositions.back.width,
                }}
              >
                <Image
                  src={currentCar.backWheel}
                  alt="Back Wheel"
                  width={200}
                  height={200}
                  sizes="(max-width: 640px) 42px, (max-width: 768px) 77px, (max-width: 1024px) 101px, 134px"
                  className="object-contain w-full h-full"
                  style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))" }}
                />
              </div>

              {/* Front Wheel - Positioned relative to car body */}
              <div
                ref={frontWheelRef}
                className="absolute z-20 aspect-square flex items-center justify-center"
                style={{
                  bottom: currentCar.wheelPositions.front.bottom,
                  left: currentCar.wheelPositions.front.left,
                  width: currentCar.wheelPositions.front.width,
                }}
              >
                <Image
                  src={currentCar.frontWheel}
                  alt="Front Wheel"
                  width={200}
                  height={200}
                  sizes="(max-width: 640px) 42px, (max-width: 768px) 77px, (max-width: 1024px) 101px, 134px"
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
        className="w-full lg:w-[450px] relative overflow-hidden flex flex-col justify-between pt-20 pb-6 px-6 sm:pt-24 sm:pb-8 sm:px-8 lg:p-12 min-h-[40vh] lg:min-h-screen"
      >
        {/* Dynamic color background */}
        <div
          ref={rightPanelBgRef}
          className="absolute inset-0"
          style={{ background: currentGradient.background }}
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
            <span className="text-white/60 text-[10px] sm:text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase">{currentCar.name}</span>
            <div className="w-10 sm:w-12 h-0.5 sm:h-1 bg-white/30 rounded-full" />
          </div>

          <h2 ref={titleRef} className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4 sm:mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              {currentCar.model}
            </span>
          </h2>

          <p ref={subtitleRef} className="text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed max-w-sm mb-6 sm:mb-8">
            Experience pure automotive excellence. Engineered for speed, designed for perfection.
          </p>

          {/* Car Brand Logo */}
          <div className="mb-6 sm:mb-8 flex justify-center" style={{ perspective: '1000px' }}>
            <div ref={logoRef} style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}>
              <Image
                src={currentCar.logo}
                alt={`${currentCar.name} Logo`}
                width={280}
                height={120}
                sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                className="object-contain h-24 sm:h-28 lg:h-32 w-auto"
                loading="lazy"
                style={{ display: 'block' }}
              />
            </div>
          </div>

          {/* Car Specifications */}
          <div ref={statsRef} className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">Top Speed</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{currentCar.specs.topSpeed}</div>
              <div className="text-xs text-white/40 mt-0.5">km/h</div>
            </div>
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">0-100 km/h</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{currentCar.specs.acceleration}</div>
              <div className="text-xs text-white/40 mt-0.5">seconds</div>
            </div>
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">Power</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{currentCar.specs.power}</div>
              <div className="text-xs text-white/40 mt-0.5">HP</div>
            </div>
            <div className="p-3 sm:p-4 lg:p-5 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-1">Torque</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{currentCar.specs.torque}</div>
              <div className="text-xs text-white/40 mt-0.5">Nm</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}