"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import type { ReactNode } from "react"

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user && mounted) {
      // Redirect to login page if not authenticated
      router.push("/login")
    }
  }, [user, loading, router, mounted])

  // If not client-side yet or still loading, show loading indicator
  if (!mounted || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // If not authenticated, don't render children
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>
  }

  return <>{children}</>
}
