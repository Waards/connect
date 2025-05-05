import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { firebaseConfig } from "./config"

// Initialize Firebase only on the client side and only once
let firebaseApp: FirebaseApp | undefined

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    // Return a mock app for SSR
    return {} as FirebaseApp
  }

  if (!firebaseApp) {
    // Check if any Firebase apps have been initialized
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig)
    } else {
      firebaseApp = getApps()[0]
    }
  }

  return firebaseApp
}
