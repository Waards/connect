import { getFirestore, type Firestore } from "firebase/firestore"
import { getFirebaseApp } from "./firebase-app"

let firestoreInstance: Firestore | null = null

export function getFirebaseFirestore(): Firestore {
  if (typeof window === "undefined") {
    // Return a mock firestore for SSR
    return {} as Firestore
  }

  if (!firestoreInstance) {
    try {
      // Get the Firebase app instance first
      const app = getFirebaseApp()
      firestoreInstance = getFirestore(app)
    } catch (error) {
      console.error("Error initializing Firestore:", error)
      throw new Error("Failed to initialize Firestore")
    }
  }

  return firestoreInstance
}

// Export a singleton instance for direct imports
export const db = typeof window !== "undefined" ? getFirebaseFirestore() : ({} as Firestore)

// Re-export Firestore functions
export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore"
