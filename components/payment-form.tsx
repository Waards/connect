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
import { createPayment } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { PLAN_DETAILS } from "./client-form"

export default function PaymentForm({ isOpen, onClose, onSubmit, client }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: 0,
    paymentMethod: "cash",
    paymentDate: new Date(),
    newDueDate: new Date(),
    notes: "",
  })

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      const planDetails = PLAN_DETAILS[client.plan] || PLAN_DETAILS.basic
      const today = new Date()
      const nextMonth = new Date(today)
      nextMonth.setMonth(today.getMonth() + 1)

      setFormData({
        amount: planDetails.price, // Fixed amount based on client's plan
        paymentMethod: "cash",
        paymentDate: today,
        newDueDate: nextMonth,
        notes: "",
      })
    }
  }, [client, isOpen])

  const handleInputChange = (field, value) => {
    // Amount is read-only, based on client's plan
    if (field === "amount") return

    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (field, date) => {
    if (field === "newDueDate") {
      // Ensure new due date is not in the past
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (date < today) {
        toast({
          title: "Invalid Date",
          description: "New due date cannot be in the past.",
          variant: "destructive",
        })
        return
      }
    }

    setFormData((prev) => ({ ...prev, [field]: date }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const paymentData = {
        clientId: client.id,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        newDueDate: formData.newDueDate,
        notes: formData.notes,
        plan: client.plan,
      }

      await createPayment(paymentData)

      toast({
        title: "Success",
        description: "Payment recorded successfully.",
      })

      onSubmit()
    } catch (error) {
      console.error("Error recording payment:", error)
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Disable past dates for new due date calendar
  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  if (!client) return null

  const planDetails = PLAN_DETAILS[client.plan] || PLAN_DETAILS.basic

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium">Client Information</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {client.firstName} {client.lastName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Plan: {planDetails.name} - ₱{planDetails.price} ({planDetails.speed} Mbps)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              readOnly
              className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500">Amount is fixed based on client's plan</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange("paymentMethod", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="paymaya">PayMaya</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.paymentDate && "text-muted-foreground",
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.paymentDate ? format(formData.paymentDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.paymentDate}
                  onSelect={(date) => handleDateChange("paymentDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>New Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.newDueDate && "text-muted-foreground",
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.newDueDate ? format(formData.newDueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.newDueDate}
                  onSelect={(date) => handleDateChange("newDueDate", date)}
                  disabled={isDateDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500">New due date cannot be in the past</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes..."
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
