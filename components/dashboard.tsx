"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { BarChart3, Users, CreditCard, WifiIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export default function Dashboard() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalPayments: 0,
    recentPayments: [],
  })
  const [loading, setLoading] = useState(true)

  // Pagination for recent payments
  const [currentPage, setCurrentPage] = useState(1)
  const [paymentsPerPage] = useState(5)
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Get total clients
        const clientsSnapshot = await getDocs(collection(db, "clients"))
        const totalClients = clientsSnapshot.size

        // Get active clients (connected)
        const activeClientsQuery = query(collection(db, "clients"), where("isConnected", "==", true))
        const activeClientsSnapshot = await getDocs(activeClientsQuery)
        const activeClients = activeClientsSnapshot.size

        // Get total payments
        const paymentsSnapshot = await getDocs(collection(db, "payments"))
        const totalPaymentsAmount = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)

        // Get total number of payments for pagination
        const totalPaymentsCount = paymentsSnapshot.size
        setTotalPayments(totalPaymentsCount)
        setTotalPages(Math.max(1, Math.ceil(totalPaymentsCount / paymentsPerPage)))

        // Get recent payments with pagination
        fetchRecentPayments(currentPage)

        setStats({
          totalClients,
          activeClients,
          totalPayments: totalPaymentsAmount,
          recentPayments: [], // Will be populated by fetchRecentPayments
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Separate function to fetch paginated recent payments
  const fetchRecentPayments = async (page) => {
    try {
      setLoading(true)

      // Calculate pagination limits
      const startIndex = (page - 1) * paymentsPerPage

      // Get all payments and sort in memory (more reliable than using limit/offset with Firestore)
      const paymentsQuery = query(collection(db, "payments"), orderBy("created_at", "desc"))
      const paymentsSnapshot = await getDocs(paymentsQuery)

      // Convert to array and paginate in memory
      const allPayments = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Get the current page of payments
      const paginatedPayments = allPayments.slice(startIndex, startIndex + paymentsPerPage)

      setStats((prevStats) => ({
        ...prevStats,
        recentPayments: paginatedPayments,
      }))

      // Update total pages
      setTotalPages(Math.max(1, Math.ceil(allPayments.length / paymentsPerPage)))
    } catch (error) {
      console.error("Error fetching recent payments:", error)
    } finally {
      setLoading(false)
    }
  }

  // Pagination controls
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      fetchRecentPayments(page)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      fetchRecentPayments(newPage)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      fetchRecentPayments(newPage)
    }
  }

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const isDark = theme === "dark"
    const buttonStyle = isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"
    const activeButtonStyle = isDark ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"

    return (
      <div className="flex items-center justify-center mt-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={currentPage === 1}
          className={currentPage === 1 ? "opacity-50" : ""}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {currentPage > 2 && (
          <>
            <Button variant="outline" size="sm" onClick={() => goToPage(1)} className={buttonStyle}>
              1
            </Button>
            {currentPage > 3 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}

        {currentPage > 1 && (
          <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} className={buttonStyle}>
            {currentPage - 1}
          </Button>
        )}

        <Button variant="outline" size="sm" className={activeButtonStyle}>
          {currentPage}
        </Button>

        {currentPage < totalPages && (
          <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} className={buttonStyle}>
            {currentPage + 1}
          </Button>
        )}

        {currentPage < totalPages - 1 && (
          <>
            {currentPage < totalPages - 2 && <span className="px-2 text-muted-foreground">...</span>}
            <Button variant="outline" size="sm" onClick={() => goToPage(totalPages)} className={buttonStyle}>
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

  if (loading && stats.recentPayments.length === 0) {
    return <div className="p-8">Loading dashboard data...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 flex-1 overflow-y-auto overflow-x-hidden">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Registered clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <WifiIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeClients}</div>
              <p className="text-xs text-muted-foreground">Connected clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{stats.totalPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{(stats.totalPayments / 12).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Average monthly</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
        <Card className="mb-4">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-full table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 w-[30%]">Client</th>
                    <th className="text-left p-4 w-[20%]">Amount</th>
                    <th className="text-left p-4 w-[30%]">Date</th>
                    <th className="text-left p-4 w-[20%]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.length > 0 ? (
                    stats.recentPayments.map((payment: any) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-4">
                          {payment.firstName} {payment.lastName}
                        </td>
                        <td className="p-4">₱{payment.amount?.toLocaleString() || 0}</td>
                        <td className="p-4">
                          {payment.created_at?.toDate ? payment.created_at.toDate().toLocaleDateString() : "N/A"}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                            {payment.status || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No recent payments
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t">{renderPagination()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
