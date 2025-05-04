"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase" // Fixed import path
import { v4 as uuidv4 } from "uuid"
import { useMediaQuery } from "@/hooks/use-media-query"

// Define plan options with prices and speeds
const PLAN_OPTIONS = [
  { value: "basic", label: "Basic - ₱800 (15 Mbps)" },
  { value: "standard", label: "Standard - ₱1000 (20 Mbps)" },
  { value: "premium", label: "Premium - ₱1500 (30 Mbps)" },
  { value: "ultimate", label: "Ultimate - ₱2000 (50 Mbps)" },
]

// Plan details mapping
export const PLAN_DETAILS = {
  basic: { price: 800, speed: 15, name: "Basic" },
  standard: { price: 1000, speed: 20, name: "Standard" },
  premium: { price: 1500, speed: 30, name: "Premium" },
  ultimate: { price: 2000, speed: 50, name: "Ultimate" },
}

interface ClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  client?: any
}

export default function ClientForm({ isOpen, onClose, onSubmit, client }: ClientFormProps) {
  const { toast } = useToast()
  const isEditing = !!client
  const isMobile = useMediaQuery("(max-width: 640px)")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    plan: "basic",
    status: "pending",
    isConnected: false,
    archived: false,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0], // Default due date is 30 days from now
    planStartDate: new Date().toISOString().split("T")[0], // Default start date is today
  })

  const [loading, setLoading] = useState(false)

  // If editing, populate form with client data
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        plan: client.plan || "basic",
        status: client.status || "pending",
        isConnected: client.isConnected || false,
        archived: client.archived || false,
        dueDate: client.dueDate
          ? new Date(client.dueDate.toDate ? client.dueDate.toDate() : client.dueDate).toISOString().split("T")[0]
          : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
        planStartDate: client.planStartDate
          ? new Date(client.planStartDate.toDate ? client.planStartDate.toDate() : client.planStartDate)
              .toISOString()
              .split("T")[0]
          : new Date().toISOString().split("T")[0],
      })
    }
  }, [client])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate phone number
      if (formData.phone.length !== 11) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid 11-digit Philippine mobile number.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Convert string dates to Firebase timestamps
      const clientData = {
        ...formData,
        dueDate: new Date(formData.dueDate),
        planStartDate: new Date(formData.planStartDate),
        // Add plan details for easy access
        planDetails: PLAN_DETAILS[formData.plan],
      }

      if (isEditing) {
        // Update existing client
        const clientRef = doc(db, "clients", client.id)
        await updateDoc(clientRef, {
          ...clientData,
          updated_at: serverTimestamp(),
        })

        toast({
          title: "Client Updated",
          description: `${formData.firstName} ${formData.lastName}'s information has been updated.`,
        })
      } else {
        // Create new client
        const newClientId = uuidv4()
        const clientRef = doc(db, "clients", newClientId)

        await setDoc(clientRef, {
          ...clientData,
          archived: false, // Ensure new clients are not archived
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        })

        toast({
          title: "Client Added",
          description: `${formData.firstName} ${formData.lastName} has been added successfully.`,
        })
      }

      onSubmit()
    } catch (error) {
      console.error("Error saving client:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} client. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? "max-w-[95vw] p-4" : "sm:max-w-[500px]"}`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update client information in the form below."
              : "Fill in the client details to add them to your system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                // Only allow numbers and limit to 11 digits
                const value = e.target.value.replace(/\D/g, "").slice(0, 11)
                setFormData((prev) => ({ ...prev, phone: value }))
              }}
              placeholder="09XXXXXXXXX"
              pattern="[0-9]{11}"
              inputMode="numeric"
              required
            />
            <p className="text-xs text-muted-foreground">Philippine mobile number (11 digits)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Internet Plan</Label>
            <Select value={formData.plan} onValueChange={(value) => handleSelectChange("plan", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planStartDate">Plan Start Date</Label>
              <Input
                id="planStartDate"
                name="planStartDate"
                type="date"
                value={formData.planStartDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isConnected">Connection Status</Label>
              <Select
                value={formData.isConnected ? "connected" : "disconnected"}
                onValueChange={(value) => handleSelectChange("isConnected", value === "connected")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connection status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
            <Button type="button" variant="outline" onClick={onClose} className={isMobile ? "w-full" : ""}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className={isMobile ? "w-full" : ""}>
              {loading ? "Saving..." : isEditing ? "Update Client" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
