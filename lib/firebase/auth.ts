import { getAuth, type Auth } from "firebase/auth"
import { getFirebaseApp } from "./firebase-app"

let authInstance: Auth | null = null

export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    // Return a mock auth for SSR
    return {} as Auth
  }

  if (!authInstance) {
    try {
      // Get the Firebase app instance first
      const app = getFirebaseApp()
      authInstance = getAuth(app)
    } catch (error) {
      console.error("Error initializing Firebase Auth:", error)
      throw new Error("Failed to initialize Firebase Auth")
    }
  }

  return authInstance
}

// Export a singleton instance for direct imports
export const auth = typeof window !== "undefined" ? getFirebaseAuth() : ({} as Auth)
