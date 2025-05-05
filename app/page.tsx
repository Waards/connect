"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  // Use useEffect to set mounted to true after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render content on the client to avoid hydration issues
  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingPageContent />
    </div>
  )
}

// Update the LandingPageContent component to handle light mode as default
function LandingPageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { theme } = useTheme()

  // Determine text and background colors based on theme
  const isDark = theme === "dark"

  useEffect(() => {
    if (!loading && user) {
      // If user is logged in, redirect to dashboard
      router.push("/dashboard")
    }
  }, [user, loading, router])

  // If loading, show loading indicator
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // If user is logged in (will redirect), don't render the landing page
  if (user) {
    return <div className="flex items-center justify-center h-screen">Redirecting to dashboard...</div>
  }

  return (
    <>
      <header className={`${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} border-b`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">InsightTrack</h1>
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-muted-foreground"} ml-2`}>
              IncConnect Solution Corp
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant={isDark ? "secondary" : "outline"}>Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section
          className={`py-20 ${isDark ? "bg-gradient-to-b from-gray-900 to-gray-950" : "bg-gradient-to-b from-white to-gray-50"}`}
        >
          <div className="container mx-auto px-4 text-center">
            <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
              Manage Your Internet Service Business with Ease
            </h1>
            <p className={`text-xl mb-10 max-w-3xl mx-auto ${isDark ? "text-gray-300" : "text-muted-foreground"}`}>
              InsightTrack helps you track clients, payments, and connections all in one place.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="px-8">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className={`py-16 ${isDark ? "bg-gray-900" : "bg-white"}`}>
          <div className="container mx-auto px-4">
            <h2 className={`text-3xl font-bold text-center mb-12 ${isDark ? "text-white" : "text-gray-900"}`}>
              Key Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className={`${isDark ? "bg-gray-800" : "bg-gray-50"} p-6 rounded-lg`}>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Client Management
                </h3>
                <p className={`${isDark ? "text-gray-300" : "text-muted-foreground"}`}>
                  Keep track of all your clients, their plans, and payment status in one place.
                </p>
              </div>
              <div className={`${isDark ? "bg-gray-800" : "bg-gray-50"} p-6 rounded-lg`}>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Payment Tracking
                </h3>
                <p className={`${isDark ? "text-gray-300" : "text-muted-foreground"}`}>
                  Record and monitor payments, generate receipts, and track revenue.
                </p>
              </div>
              <div className={`${isDark ? "bg-gray-800" : "bg-gray-50"} p-6 rounded-lg`}>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Connection Control
                </h3>
                <p className={`${isDark ? "text-gray-300" : "text-muted-foreground"}`}>
                  Automatically manage WiFi connections based on payment status.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold">InsightTrack</h2>
              <p className="text-gray-400">IncConnect Solution Corp</p>
            </div>
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} InsightTrack. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
