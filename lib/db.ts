import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection, updateDoc } from "firebase/firestore"
import { db } from "./firebase"

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
