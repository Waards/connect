"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { addDoc, collection, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

// Plan details with pricing
export const PLAN_DETAILS = {
  basic: { name: "Basic", price: 800, speed: 15 },
  standard: { name: "Standard", price: 1200, speed: 25 },
  premium: { name: "Premium", price: 1800, speed: 50 },
  enterprise: { name: "Enterprise", price: 2500, speed: 100 },
}

export default function ClientForm({ isOpen, onClose, onSubmit, client = null }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    plan: "basic",
    planStartDate: new Date(),
    dueDate: new Date(),
  })

  // Initialize form data when client prop changes
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        plan: client.plan || "basic",
        planStartDate: client.planStartDate?.toDate
          ? client.planStartDate.toDate()
          : new Date(client.planStartDate || Date.now()),
        dueDate: client.dueDate?.toDate ? client.dueDate.toDate() : new Date(client.dueDate || Date.now()),
      })
    } else {
      // Reset form for new client
      const today = new Date()
      const nextMonth = new Date(today)
      nextMonth.setMonth(today.getMonth() + 1)

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        plan: "basic",
        planStartDate: today,
        dueDate: nextMonth,
      })
    }
  }, [client, isOpen])

  const handleInputChange = (field, value) => {
    if (field === "phone") {
      // Format phone number to +63 format
      let formattedPhone = value.replace(/\D/g, "") // Remove non-digits

      if (formattedPhone.startsWith("63")) {
        formattedPhone = formattedPhone.substring(2)
      } else if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.substring(1)
      }

      // Limit to 10 digits after +63
      if (formattedPhone.length > 10) {
        formattedPhone = formattedPhone.substring(0, 10)
      }

      value = formattedPhone ? `+63${formattedPhone}` : ""
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (field, date) => {
    if (field === "dueDate") {
      // Ensure due date is not in the past
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (date < today) {
        toast({
          title: "Invalid Date",
          description: "Due date cannot be in the past.",
          variant: "destructive",
        })
        return
      }
    }

    setFormData((prev) => ({ ...prev, [field]: date }))
  }

  const validateForm = () => {
    const { firstName, lastName, email, phone, address } = formData

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      })
      return false
    }

    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return false
    }

    if (!phone.trim() || !phone.startsWith("+63") || phone.length !== 13) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid Philippine phone number (+63XXXXXXXXXX).",
        variant: "destructive",
      })
      return false
    }

    if (!address.trim()) {
      toast({
        title: "Validation Error",
        description: "Address is required.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const clientData = {
        ...formData,
        planStartDate: formData.planStartDate,
        dueDate: formData.dueDate,
        updated_at: serverTimestamp(),
      }

      if (client) {
        // Update existing client
        const clientRef = doc(db, "clients", client.id)
        await updateDoc(clientRef, clientData)

        toast({
          title: "Success",
          description: "Client updated successfully.",
        })
      } else {
        // Create new client
        await addDoc(collection(db, "clients"), {
          ...clientData,
          created_at: serverTimestamp(),
          archived: false,
          isConnected: true,
          status: "pending",
        })

        toast({
          title: "Success",
          description: "Client added successfully.",
        })
      }

      onSubmit()
    } catch (error) {
      console.error("Error saving client:", error)
      toast({
        title: "Error",
        description: "Failed to save client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Disable past dates for due date calendar
  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+63XXXXXXXXXX"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Format: +63XXXXXXXXXX (Philippine mobile number)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter complete address"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Internet Plan *</Label>
            <Select
              value={formData.plan}
              onValueChange={(value) => handleInputChange("plan", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
                  <SelectItem key={key} value={key}>
                    {plan.name} - ₱{plan.price}/month ({plan.speed} Mbps)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plan Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.planStartDate && "text-muted-foreground",
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.planStartDate ? format(formData.planStartDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.planStartDate}
                    onSelect={(date) => handleDateChange("planStartDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground",
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => handleDateChange("dueDate", date)}
                    disabled={isDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">Due date cannot be in the past</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600" disabled={loading}>
              {loading ? "Saving..." : client ? "Update Client" : "Add Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
