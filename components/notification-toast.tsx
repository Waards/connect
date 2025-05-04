"use client"

import { CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface NotificationToastProps {
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  duration?: number
}

export function showNotification({ type = "info", title, message, duration = 5000 }: NotificationToastProps) {
  const { toast } = useToast()

  const icon = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500" />,
  }[type]

  const variant = {
    success: "default",
    warning: "default",
    error: "destructive",
    info: "default",
  }[type]

  toast({
    variant,
    title: (
      <div className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
    ),
    description: message,
    duration,
  })
}
