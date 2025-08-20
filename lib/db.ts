import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  addDoc,
  collection,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore"
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

// Get all clients
export async function getClients() {
  try {
    const clientsRef = collection(db, "clients")
    const q = query(clientsRef, orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure dates are properly formatted
      createdAt: doc.data().created_at?.toDate?.() || new Date(),
      dueDate: doc.data().dueDate?.toDate?.() || new Date(),
      installationDate: doc.data().planStartDate?.toDate?.() || new Date(),
    }))
  } catch (error) {
    console.error("Error getting clients:", error)
    throw error
  }
}

// Create a new client
export async function createClient(clientData: any) {
  try {
    // Format phone number to +63 format
    if (clientData.phone && !clientData.phone.startsWith("+63")) {
      const cleanPhone = clientData.phone.replace(/^(\+63|63|0)/, "")
      clientData.phone = `+63${cleanPhone}`
    }

    const clientWithMetadata = {
      ...clientData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      archived: false,
      isConnected: true,
      status: "pending",
    }

    const docRef = await addDoc(collection(db, "clients"), clientWithMetadata)
    return { id: docRef.id, ...clientWithMetadata }
  } catch (error) {
    console.error("Error creating client:", error)
    throw error
  }
}

// Update a client
export async function updateClient(clientId: string, clientData: any) {
  try {
    // Format phone number to +63 format
    if (clientData.phone && !clientData.phone.startsWith("+63")) {
      const cleanPhone = clientData.phone.replace(/^(\+63|63|0)/, "")
      clientData.phone = `+63${cleanPhone}`
    }

    const clientRef = doc(db, "clients", clientId)
    await updateDoc(clientRef, {
      ...clientData,
      updated_at: serverTimestamp(),
    })

    return { id: clientId, ...clientData }
  } catch (error) {
    console.error("Error updating client:", error)
    throw error
  }
}

// Delete a client
export async function deleteClient(clientId: string) {
  try {
    const clientRef = doc(db, "clients", clientId)
    await deleteDoc(clientRef)
  } catch (error) {
    console.error("Error deleting client:", error)
    throw error
  }
}

// Get all payments
export async function getPayments() {
  try {
    const paymentsRef = collection(db, "payments")
    const q = query(paymentsRef, orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date(),
    }))
  } catch (error) {
    console.error("Error getting payments:", error)
    throw error
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

// Get payments for a specific client
export async function getClientPayments(clientId: string) {
  try {
    const paymentsRef = collection(db, "payments")
    const q = query(paymentsRef, where("clientId", "==", clientId), orderBy("created_at", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date(),
    }))
  } catch (error) {
    console.error("Error getting client payments:", error)
    throw error
  }
}

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    const [clientsSnapshot, paymentsSnapshot] = await Promise.all([
      getDocs(collection(db, "clients")),
      getDocs(collection(db, "payments")),
    ])

    const clients = clientsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const payments = paymentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    const totalClients = clients.length
    const activeClients = clients.filter((client) => client.status === "paid" || client.status === "pending").length
    const overdueClients = clients.filter((client) => client.status === "overdue").length
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)

    // Calculate monthly revenue for the current month
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyRevenue = payments
      .filter((payment) => {
        const paymentDate = payment.created_at?.toDate?.() || new Date(payment.created_at)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0)

    return {
      totalClients,
      activeClients,
      overdueClients,
      totalRevenue,
      monthlyRevenue,
      recentPayments: payments.slice(0, 5), // Last 5 payments
    }
  } catch (error) {
    console.error("Error getting dashboard stats:", error)
    throw error
  }
}
