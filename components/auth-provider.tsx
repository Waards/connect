"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase-init"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Ensure auth is available
    if (!auth) {
      console.error("Auth is not available")
      setLoading(false)
      return
    }

    // Use a small delay to ensure Firebase is fully initialized
    const timer = setTimeout(() => {
      try {
        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            setUser(user)
            setLoading(false)
            setInitialized(true)
          },
          (error) => {
            console.error("Auth state change error:", error)
            setLoading(false)
            setInitialized(true)
          },
        )

        return () => {
          unsubscribe()
        }
      } catch (error) {
        console.error("Auth provider setup error:", error)
        setLoading(false)
        setInitialized(true)
        return () => {}
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value = { user, loading }

  // Show loading state until auth is initialized
  if (!initialized && loading) {
    return <div className="flex items-center justify-center h-screen">Initializing authentication...</div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
