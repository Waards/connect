// Re-export everything from the individual modules
export { getFirebaseApp } from "./firebase-app"
export { auth, getFirebaseAuth } from "./auth"
export {
  db,
  getFirebaseFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "./firestore"
export { firebaseConfig } from "./config"

// Export a default app for compatibility
import { getFirebaseApp } from "./firebase-app"
export default getFirebaseApp()
