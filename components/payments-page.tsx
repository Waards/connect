"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function PaymentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme } = useTheme()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [paymentsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Check if the screen is mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Fetch payments data
  const fetchPayments = async () => {
    try {
      setLoading(true)

      // Get all payments
      const paymentsSnapshot = await getDocs(collection(db, "payments"))

      const paymentsList = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Sort by created_at in memory
      paymentsList.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0)
        const dateB = b.created_at?.toDate?.() || new Date(0)
        return dateB - dateA // Descending order (newest first)
      })

      setPayments(paymentsList)

      // Calculate total pages
      setTotalPages(Math.max(1, Math.ceil(paymentsList.length / paymentsPerPage)))
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [user])

  // Format date from Firestore timestamp
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "N/A"
    return format(timestamp.toDate(), "MMM d, yyyy h:mm a")
  }

  // Get paginated payments
  const getPaginatedPayments = () => {
    const indexOfLastPayment = currentPage * paymentsPerPage
    const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage
    return payments.slice(indexOfFirstPayment, indexOfLastPayment)
  }

  // Pagination functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxPageButtons = isMobile ? 3 : 5

    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1)

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1)
    }

    // Create page number buttons
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    const isDark = theme === "dark"
    const buttonStyle = isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"
    const activeButtonStyle = isDark ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"

    return (
      <div className="flex items-center justify-center mt-4 mb-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className={currentPage === 1 ? "opacity-50" : ""}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => goToPage(1)} className={`${buttonStyle}`}>
              1
            </Button>
            {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}

        {pageNumbers.map((number) => (
          <Button
            key={number}
            variant="outline"
            size="sm"
            onClick={() => goToPage(number)}
            className={`${number === currentPage ? activeButtonStyle : buttonStyle}`}
          >
            {number}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
            <Button variant="outline" size="sm" onClick={() => goToPage(totalPages)} className={`${buttonStyle}`}>
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={currentPage === totalPages ? "opacity-50" : ""}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const paginatedPayments = getPaginatedPayments()

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 flex-1 overflow-y-auto overflow-x-hidden">
        <h1 className="text-3xl font-bold mb-6">Payment History</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-4">
            {paginatedPayments.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-full table-fixed">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 w-[25%]">Client</th>
                      <th className="text-left p-4 w-[15%]">Amount</th>
                      <th className="text-left p-4 w-[25%]">Date</th>
                      <th className="text-left p-4 w-[15%]">Method</th>
                      <th className="text-left p-4 w-[20%]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment: any) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-4">
                          {payment.firstName} {payment.lastName}
                        </td>
                        <td className="p-4">₱{payment.amount?.toLocaleString() || 0}</td>
                        <td className="p-4">{formatDate(payment.created_at)}</td>
                        <td className="p-4">
                          <span className="capitalize">{payment.paymentMethod || "Cash"}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                            {payment.status || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                {loading ? "Loading payments..." : "No payment records found."}
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t">{renderPagination()}</div>
        </Card>
      </div>
    </div>
  )
}
