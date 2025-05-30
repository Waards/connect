import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth"
import { auth } from "@/lib/firebase-init"

// Login function
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    if (typeof window === "undefined") {
      throw new Error("Authentication can only be performed in the browser")
    }

    if (!auth) {
      throw new Error("Firebase Auth is not initialized")
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Login error:", error)
    throw new Error(error.message || "Failed to login")
  }
}

// Logout function
export async function logoutUser(): Promise<void> {
  try {
    if (typeof window === "undefined") {
      throw new Error("Authentication can only be performed in the browser")
    }

    if (!auth) {
      throw new Error("Firebase Auth is not initialized")
    }

    await signOut(auth)
  } catch (error: any) {
    console.error("Logout error:", error)
    throw new Error(error.message || "Failed to logout")
  }
}

// Register function
export async function registerUser(email: string, password: string, displayName: string): Promise<User> {
  try {
    if (typeof window === "undefined") {
      throw new Error("Authentication can only be performed in the browser")
    }

    if (!auth) {
      throw new Error("Firebase Auth is not initialized")
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update the user's profile with the display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      })
    }

    return userCredential.user
  } catch (error: any) {
    console.error("Registration error:", error)
    throw new Error(error.message || "Failed to register")
  }
}
