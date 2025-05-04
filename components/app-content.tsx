"use client"

import { useAuth } from "@/components/auth-provider"
import Sidebar from "@/components/sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { ReactNode } from "react"
import { useTheme } from "@/components/theme-provider"

export default function AppContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // If no user, don't render anything (will redirect in useEffect)
  if (!user) {
    return null
  }

  // Determine background color based on theme
  const bgColor = theme === "dark" ? "bg-gray-950" : "bg-gray-50"

  // If user is authenticated, render the sidebar layout
  return (
    <div className={`flex h-screen w-full overflow-hidden ${bgColor}`}>
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">{children}</main>
    </div>
  )
}
