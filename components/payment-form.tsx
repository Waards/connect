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
import { createPayment } from "@/lib/db"
import { PLAN_DETAILS } from "./client-form"
import { useMediaQuery } from "@/hooks/use-media-query"

interface PaymentFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  client: any
}

export default function PaymentForm({ isOpen, onClose, onSubmit, client }: PaymentFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Get plan price from client's plan
  const getPlanPrice = () => {
    const plan = client.plan || "basic"
    return PLAN_DETAILS[plan]?.price || 800
  }

  const [formData, setFormData] = useState({
    amount: getPlanPrice(), // Default amount based on plan
    paymentMethod: "cash",
    notes: "",
    extendMonths: 1, // Default to extend by 1 month
  })

  useEffect(() => {
    // Update amount when client changes
    setFormData((prev) => ({
      ...prev,
      amount: getPlanPrice(),
    }))
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
      // Calculate new due date based on current due date and extension months
      let newDueDate = new Date()

      if (client.dueDate) {
        // Start from current due date if it exists and is in the future
        const currentDueDate = client.dueDate.toDate ? client.dueDate.toDate() : new Date(client.dueDate)
        const today = new Date()

        if (currentDueDate > today) {
          newDueDate = currentDueDate
        }
      }

      // Add months based on extension
      newDueDate.setMonth(newDueDate.getMonth() + Number.parseInt(formData.extendMonths))

      // Create payment record
      const paymentData = {
        clientId: client.id,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        extendMonths: Number.parseInt(formData.extendMonths),
        newDueDate: newDueDate,
      }

      await createPayment(paymentData)

      // Show success notification
      toast({
        title: "Payment Recorded",
        description: `Payment of ₱${Number(formData.amount).toLocaleString()} for ${client.firstName} ${client.lastName} has been recorded.`,
        variant: "default",
      })

      onSubmit()
    } catch (error) {
      console.error("Error recording payment:", error)
      toast({
        title: "Payment Failed",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get plan details display
  const getPlanDisplay = () => {
    const plan = client.plan || "basic"
    const details = PLAN_DETAILS[plan] || { name: "Unknown", price: 0, speed: 0 }
    return `${details.name} - ₱${details.price} (${details.speed} Mbps)`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? "max-w-[95vw] p-4" : "sm:max-w-[500px]"}`}>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter payment details for {client.firstName} {client.lastName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Client</Label>
            <div className="p-2 border rounded-md bg-muted">
              {client.firstName} {client.lastName}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Current Plan</Label>
            <div className="p-2 border rounded-md bg-muted">{getPlanDisplay()}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="any"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extendMonths">Extend Subscription By</Label>
            <Select
              value={formData.extendMonths.toString()}
              onValueChange={(value) => handleSelectChange("extendMonths", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="2">2 Months</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleSelectChange("paymentMethod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input id="notes" name="notes" value={formData.notes} onChange={handleChange} />
          </div>

          <DialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
            <Button type="button" variant="outline" onClick={onClose} className={isMobile ? "w-full" : ""}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className={isMobile ? "w-full" : ""}>
              {loading ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
