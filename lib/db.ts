import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase-init"

// Function to ensure Firestore is initialized
function ensureFirestore() {
  if (typeof window === "undefined") {
    throw new Error("Firestore operations can only be performed in the browser")
  }

  if (!db) {
    throw new Error("Firestore is not initialized")
  }

  return db
}

// Add a document to a collection
export async function addDocument(collectionName: string, data: any) {
  const firestore = ensureFirestore()
  return await addDoc(collection(firestore, collectionName), {
    ...data,
    createdAt: new Date(),
  })
}

// Get all documents from a collection
export async function getDocuments(collectionName: string) {
  const firestore = ensureFirestore()
  const querySnapshot = await getDocs(collection(firestore, collectionName))
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

// Get a document by ID
export async function getDocument(collectionName: string, documentId: string) {
  const firestore = ensureFirestore()
  const docRef = doc(firestore, collectionName, documentId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    }
  } else {
    return null
  }
}

// Update a document
export async function updateDocument(collectionName: string, documentId: string, data: any) {
  const firestore = ensureFirestore()
  const docRef = doc(firestore, collectionName, documentId)
  return await updateDoc(docRef, {
    ...data,
    updatedAt: new Date(),
  })
}

// Delete a document
export async function deleteDocument(collectionName: string, documentId: string) {
  const firestore = ensureFirestore()
  const docRef = doc(firestore, collectionName, documentId)
  return await deleteDoc(docRef)
}

// Query documents
export async function queryDocuments(
  collectionName: string,
  conditions: any[],
  sortBy?: string,
  sortDirection?: "asc" | "desc",
) {
  const firestore = ensureFirestore()

  let q = collection(firestore, collectionName)

  if (conditions.length > 0) {
    const filters = conditions.map((condition) => where(condition.field, condition.operator, condition.value))
    q = query(q, ...filters)
  }

  if (sortBy) {
    q = query(q, orderBy(sortBy, sortDirection || "asc"))
  }

  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

// Update the getUserProfile function in lib/db.ts
export async function getUserProfile(userId: string) {
  try {
    // First check if the user document exists
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      }
    } else {
      // If the user document doesn't exist, create it with basic info
      const newUserData = {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "IncConnect Solution Corp",
        position: "",
        role: "staff",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      await setDoc(docRef, newUserData)

      return {
        id: userId,
        ...newUserData,
      }
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    // Return a default profile instead of null to prevent errors
    return {
      id: userId,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "IncConnect Solution Corp",
      position: "",
      role: "staff",
    }
  }
}

// Update the createPayment function in lib/db.ts
export async function createPayment(paymentData: any) {
  try {
    // Get client details to include in the payment record
    const clientRef = doc(db, "clients", paymentData.clientId)
    const clientSnap = await getDoc(clientRef)

    let clientData = {}
    if (clientSnap.exists()) {
      const client = clientSnap.data()
      clientData = {
        firstName: client.firstName || "",
        lastName: client.lastName || "",
      }
    }

    // Add timestamp and client data
    const paymentWithMetadata = {
      ...paymentData,
      ...clientData,
      status: "completed",
      created_at: serverTimestamp(),
    }

    // Create the payment record
    const docRef = await addDoc(collection(db, "payments"), paymentWithMetadata)

    // Update client status to 'paid', connection status to 'connected', and due date
    await updateDoc(clientRef, {
      status: "paid",
      isConnected: true,
      lastPaymentDate: serverTimestamp(),
      lastPaymentAmount: paymentData.amount,
      lastPaymentId: docRef.id,
      dueDate: paymentData.newDueDate,
      updated_at: serverTimestamp(),
    })

    return { id: docRef.id, ...paymentWithMetadata }
  } catch (error) {
    console.error("Error creating payment:", error)
    throw error
  }
}
