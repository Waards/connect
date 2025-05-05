"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

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
  const [authInitialized, setAuthInitialized] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    let unsubscribe: () => void = () => {}

    // Wrap in a setTimeout to ensure Firebase has time to initialize
    const initializeAuth = setTimeout(() => {
      try {
        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            setUser(user)
            setLoading(false)
            setAuthInitialized(true)
          },
          (error) => {
            console.error("Auth state change error:", error)
            setLoading(false)
            setAuthInitialized(true)
          },
        )
      } catch (error) {
        console.error("Auth provider setup error:", error)
        setLoading(false)
        setAuthInitialized(true)
      }
    }, 50)

    // Clean up
    return () => {
      clearTimeout(initializeAuth)
      unsubscribe()
    }
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value = { user, loading }

  // Only render children when auth is initialized or after loading timeout
  if (!authInitialized && loading) {
    return <div className="flex items-center justify-center h-screen">Initializing application...</div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
