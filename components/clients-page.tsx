"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import {
  PlusCircle,
  Edit,
  Archive,
  MoreHorizontal,
  CreditCard,
  Wifi,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import ClientForm from "./client-form"
import PaymentForm from "./payment-form"
import { PLAN_DETAILS } from "./client-form"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTheme } from "@/components/theme-provider"

export default function ClientsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme } = useTheme()
  const [clients, setClients] = useState([])
  const [archivedClients, setArchivedClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const [sortBy, setSortBy] = useState("dueDate") // Default sort by due date

  // Pagination state - changed to 5 clients per page
  const [currentPage, setCurrentPage] = useState(1)
  const [clientsPerPage, setClientsPerPage] = useState(5)
  const [totalPages, setTotalPages] = useState(1)

  // Check if the screen is mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // State for modals
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [showEditClientModal, setShowEditClientModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  // Fetch clients data
  const fetchClients = async () => {
    try {
      setLoading(true)

      // Fetch all clients first, then filter in memory to avoid index issues
      const clientsSnapshot = await getDocs(collection(db, "clients"))

      const allClients = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Filter active and archived clients in memory
      const activeClientsList = allClients.filter((client) => !client.archived)
      const archivedClientsList = allClients.filter((client) => client.archived)

      // Check for overdue clients and update their status
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const updatedActiveClients = await Promise.all(
        activeClientsList.map(async (client) => {
          let clientDueDate = null

          if (client.dueDate) {
            clientDueDate = client.dueDate.toDate ? client.dueDate.toDate() : new Date(client.dueDate)
            clientDueDate.setHours(0, 0, 0, 0)

            // If due date has passed and status is not overdue, update to overdue
            if (clientDueDate < today && client.status !== "overdue") {
              const clientRef = doc(db, "clients", client.id)
              await updateDoc(clientRef, {
                status: "overdue",
                updated_at: new Date(),
              })
              return { ...client, status: "overdue" }
            }
          }

          return client
        }),
      )

      // Sort clients based on sortBy
      const sortedActiveClients = sortClients(updatedActiveClients, sortBy)
      const sortedArchivedClients = sortClients(archivedClientsList, "lastName")

      setClients(sortedActiveClients)
      setArchivedClients(sortedArchivedClients)

      // Calculate total pages for active clients
      setTotalPages(Math.max(1, Math.ceil(sortedActiveClients.length / clientsPerPage)))

      // Reset to page 1 if current page is beyond total pages
      if (currentPage > Math.max(1, Math.ceil(sortedActiveClients.length / clientsPerPage))) {
        setCurrentPage(1)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Sort clients based on criteria
  const sortClients = (clientsList, criteria) => {
    return [...clientsList].sort((a, b) => {
      if (criteria === "dueDate") {
        const dateA = a.dueDate ? (a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate)) : new Date(9999, 11, 31)
        const dateB = b.dueDate ? (b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate)) : new Date(9999, 11, 31)
        return dateA - dateB
      } else if (criteria === "status") {
        // Sort by status priority: overdue, pending, paid
        const statusPriority = { overdue: 0, pending: 1, paid: 2 }
        return (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3)
      } else if (criteria === "lastName") {
        return (a.lastName || "").localeCompare(b.lastName || "")
      } else if (criteria === "plan") {
        // Sort by plan price (highest to lowest)
        const planPriceA = PLAN_DETAILS[a.plan]?.price || 0
        const planPriceB = PLAN_DETAILS[b.plan]?.price || 0
        return planPriceB - planPriceA
      }
      return 0
    })
  }

  // Handle sort change
  const handleSortChange = (criteria) => {
    setSortBy(criteria)
    setClients(sortClients([...clients], criteria))
  }

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  // Handle archiving a client
  const handleArchiveClient = async (client) => {
    try {
      const clientRef = doc(db, "clients", client.id)
      await updateDoc(clientRef, {
        archived: true,
        updated_at: new Date(),
      })

      // Show a notification using the toast system
      toast({
        title: "Client Archived",
        description: `${client.firstName} ${client.lastName} has been moved to the archive.`,
        variant: "default",
      })

      // Refresh client list
      fetchClients()
    } catch (error) {
      console.error("Error archiving client:", error)
      toast({
        title: "Archive Failed",
        description: "Failed to archive client. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle restoring an archived client
  const handleRestoreClient = async (client) => {
    try {
      const clientRef = doc(db, "clients", client.id)
      await updateDoc(clientRef, {
        archived: false,
        updated_at: new Date(),
      })

      // Show a notification using the toast system
      toast({
        title: "Client Restored",
        description: `${client.firstName} ${client.lastName} has been restored from the archive.`,
        variant: "default",
      })

      // Refresh client list
      fetchClients()
    } catch (error) {
      console.error("Error restoring client:", error)
      toast({
        title: "Restore Failed",
        description: "Failed to restore client. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle edit client
  const handleEditClient = (client) => {
    setSelectedClient(client)
    setShowEditClientModal(true)
  }

  // Handle add payment
  const handleAddPayment = (client) => {
    setSelectedClient(client)
    setShowPaymentModal(true)
  }

  // Handle client form submission (add/edit)
  const handleClientFormSubmit = () => {
    setShowAddClientModal(false)
    setShowEditClientModal(false)
    setSelectedClient(null)
    fetchClients()
  }

  // Handle payment form submission
  const handlePaymentFormSubmit = () => {
    setShowPaymentModal(false)
    setSelectedClient(null)
    fetchClients()
  }

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "N/A"
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString()
  }

  // Get days until due
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get plan details display
  const getPlanDisplay = (plan) => {
    const details = PLAN_DETAILS[plan] || { name: "Unknown", price: 0, speed: 0 }
    return `${details.name} - ₱${details.price} (${details.speed} Mbps)`
  }

  // Get status badge
  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[status] || statusClasses.pending}`}>
        {status || "Pending"}
      </span>
    )
  }

  // Get connection badge
  const getConnectionBadge = (isConnected) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          isConnected
            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
        }`}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    )
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

  // Get current clients for pagination
  const getCurrentClients = () => {
    const indexOfLastClient = currentPage * clientsPerPage
    const indexOfFirstClient = indexOfLastClient - clientsPerPage
    return clients.slice(indexOfFirstClient, indexOfLastClient)
  }

  // Calculate client statistics
  const getClientStats = () => {
    const totalClients = clients.length
    const connectedClients = clients.filter((client) => client.isConnected).length
    const overdueClients = clients.filter((client) => client.status === "overdue").length

    return { totalClients, connectedClients, overdueClients }
  }

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null

    // Create an array of page numbers to display
    const pageNumbers = []
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }

    const isDark = theme === "dark"
    const buttonBgColor = isDark ? "bg-gray-800" : "bg-gray-200"
    const buttonTextColor = isDark ? "text-white" : "text-gray-800"
    const buttonHoverColor = isDark ? "hover:bg-gray-700" : "hover:bg-gray-300"
    const activeButtonBgColor = "bg-green-500"
    const activeButtonTextColor = "text-white"

    return (
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="icon"
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`${buttonBgColor} ${buttonTextColor} ${buttonHoverColor} disabled:opacity-50 w-8 h-8 p-0`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((number) => (
          <Button
            key={number}
            variant="outline"
            size="icon"
            onClick={() => goToPage(number)}
            className={`w-8 h-8 p-0 ${
              currentPage === number
                ? `${activeButtonBgColor} ${activeButtonTextColor} hover:bg-green-600`
                : `${buttonBgColor} ${buttonTextColor} ${buttonHoverColor}`
            }`}
          >
            {number}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`${buttonBgColor} ${buttonTextColor} ${buttonHoverColor} disabled:opacity-50 w-8 h-8 p-0`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const clientStats = getClientStats()

  if (loading && clients.length === 0 && archivedClients.length === 0) {
    return <div className="p-4 md:p-8">Loading clients...</div>
  }

  // Get current page clients
  const currentClients = getCurrentClients()

  // Determine colors based on theme
  const isDark = theme === "dark"
  const bgColor = isDark ? "bg-[#0a0b14]" : "bg-gray-50"
  const cardBgColor = isDark ? "bg-[#0f1018]" : "bg-white"
  const borderColor = isDark ? "border-gray-800" : "border-gray-200"
  const textColor = isDark ? "text-white" : "text-gray-900"
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-500"
  const headerBgColor = isDark ? "bg-gray-800/50" : "bg-gray-100"
  const statBgColor = isDark ? "bg-gray-800" : "bg-gray-100"
  const hoverBgColor = isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"
  const rowBorderColor = isDark ? "border-gray-800" : "border-gray-200"

  return (
    <div className={`w-full h-full flex flex-col ${bgColor}`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className={`text-2xl md:text-3xl font-bold ${textColor}`}>Clients</h1>
          <Button onClick={() => setShowAddClientModal(true)} className="bg-green-500 hover:bg-green-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          {/* More minimalist tab style */}
          <TabsList className="mb-4 w-full md:w-auto bg-transparent p-0 border-b border-gray-200">
            <TabsTrigger
              value="active"
              className="px-4 py-2 data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 text-gray-500 bg-transparent rounded-none"
            >
              Active Clients
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="px-4 py-2 data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 text-gray-500 bg-transparent rounded-none"
            >
              Archived Clients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="m-0 p-0 flex-1 flex flex-col">
            <div className={`${cardBgColor} rounded-md border ${borderColor} flex-1 flex flex-col`}>
              <div
                className={`p-4 border-b ${borderColor} flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0`}
              >
                <h2 className={`text-lg font-medium ${textColor}`}>Client List</h2>
                {!isMobile && (
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${mutedTextColor}`}>Sort by:</span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant={sortBy === "dueDate" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("dueDate")}
                        className={
                          sortBy === "dueDate"
                            ? "bg-green-500 text-white"
                            : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`
                        }
                      >
                        Due Date
                      </Button>
                      <Button
                        variant={sortBy === "status" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("status")}
                        className={
                          sortBy === "status"
                            ? "bg-green-500 text-white"
                            : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`
                        }
                      >
                        Status
                      </Button>
                      <Button
                        variant={sortBy === "plan" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("plan")}
                        className={
                          sortBy === "plan"
                            ? "bg-green-500 text-white"
                            : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`
                        }
                      >
                        Plan
                      </Button>
                      <Button
                        variant={sortBy === "lastName" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("lastName")}
                        className={
                          sortBy === "lastName"
                            ? "bg-green-500 text-white"
                            : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`
                        }
                      >
                        Name
                      </Button>
                    </div>
                  </div>
                )}
                {isMobile && (
                  <div className="w-full">
                    <p className={`text-sm ${mutedTextColor} mb-2`}>Sort by:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={sortBy === "dueDate" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("dueDate")}
                        className={`w-full ${sortBy === "dueDate" ? "bg-green-500 text-white" : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`}`}
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        Due Date
                      </Button>
                      <Button
                        variant={sortBy === "status" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("status")}
                        className={`w-full ${sortBy === "status" ? "bg-green-500 text-white" : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`}`}
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Status
                      </Button>
                      <Button
                        variant={sortBy === "plan" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("plan")}
                        className={`w-full ${sortBy === "plan" ? "bg-green-500 text-white" : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`}`}
                      >
                        <Wifi className="mr-1 h-3 w-3" />
                        Plan
                      </Button>
                      <Button
                        variant={sortBy === "lastName" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSortChange("lastName")}
                        className={`w-full ${sortBy === "lastName" ? "bg-green-500 text-white" : `${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"} ${textColor}`}`}
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Name
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {clients.length > 0 ? (
                <>
                  <div className="overflow-auto">
                    {/* Desktop view - custom table */}
                    <div>
                      <div
                        className={`grid grid-cols-12 gap-2 py-2 px-4 ${headerBgColor} ${mutedTextColor} text-sm sticky top-0 z-10`}
                      >
                        <div className="col-span-2">Name</div>
                        <div className="col-span-2">Contact</div>
                        <div className="col-span-2">Plan</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-2">Due Date</div>
                        <div className="col-span-1 text-center">Connection</div>
                        <div className="col-span-1">Last Payment</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                      <div>
                        {currentClients.map((client) => {
                          const daysUntilDue = getDaysUntilDue(client.dueDate)
                          const isOverdue = daysUntilDue !== null && daysUntilDue < 0
                          const isNearDue = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3

                          return (
                            <div
                              key={client.id}
                              className={`border-b ${rowBorderColor} py-4 px-2 ${hoverBgColor} transition-colors ${
                                isOverdue
                                  ? isDark
                                    ? "bg-red-950/20"
                                    : "bg-red-50"
                                  : isNearDue
                                    ? (isDark ? "bg-yellow-950/20" : "bg-yellow-50")
                                    : ""
                              }`}
                            >
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-2">
                                  <div className={`font-medium ${textColor}`}>
                                    {client.firstName} {client.lastName}
                                  </div>
                                  <div className={`text-sm ${mutedTextColor}`}>{client.address}</div>
                                </div>

                                <div className="col-span-2">
                                  <div className={`text-sm ${textColor}`}>{client.email}</div>
                                  <div className={`text-sm ${mutedTextColor}`}>{client.phone}</div>
                                </div>

                                <div className="col-span-2">
                                  <div className={`font-medium ${textColor}`}>
                                    {PLAN_DETAILS[client.plan]?.name || "Basic"} - ₱
                                    {PLAN_DETAILS[client.plan]?.price || "800"}
                                  </div>
                                  <div className={`text-sm ${mutedTextColor}`}>
                                    ({PLAN_DETAILS[client.plan]?.speed || "15"} Mbps)
                                  </div>
                                  <div className={`text-xs ${mutedTextColor}`}>
                                    Started: {formatDate(client.planStartDate)}
                                  </div>
                                </div>

                                <div className="col-span-1 text-center">{getStatusBadge(client.status)}</div>

                                <div className="col-span-2">
                                  <div className={textColor}>{formatDate(client.dueDate)}</div>
                                  {daysUntilDue !== null && (
                                    <div
                                      className={`text-sm ${
                                        isOverdue
                                          ? "text-red-500 font-medium"
                                          : isNearDue
                                            ? "text-yellow-500"
                                            : mutedTextColor
                                      }`}
                                    >
                                      {isOverdue
                                        ? `${Math.abs(daysUntilDue)} days overdue`
                                        : `${daysUntilDue} days left`}
                                    </div>
                                  )}
                                </div>

                                <div className="col-span-1 text-center">{getConnectionBadge(client.isConnected)}</div>

                                <div className="col-span-1">
                                  <div className={textColor}>
                                    {client.lastPaymentDate?.toDate ? formatDate(client.lastPaymentDate) : "No payment"}
                                  </div>
                                  {client.lastPaymentAmount && (
                                    <div className={`text-sm ${mutedTextColor}`}>
                                      ₱{client.lastPaymentAmount.toLocaleString()}
                                    </div>
                                  )}
                                </div>

                                <div className="col-span-1 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className={`h-8 w-8 ${textColor}`}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Client
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleAddPayment(client)}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Record Payment
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleArchiveClient(client)}>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive Client
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Client statistics and pagination footer */}
                  <div className={`p-4 border-t ${borderColor} ${cardBgColor} mt-auto`}>
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div className="flex flex-wrap gap-2">
                        <div className={`${statBgColor} px-3 py-1.5 rounded-md text-sm`}>
                          <span className={mutedTextColor}>Total:</span>{" "}
                          <span className={`${textColor} font-medium`}>{clientStats.totalClients}</span>
                        </div>
                        <div className={`${statBgColor} px-3 py-1.5 rounded-md text-sm`}>
                          <span className={mutedTextColor}>Connected:</span>{" "}
                          <span className={`${textColor} font-medium`}>{clientStats.connectedClients}</span>
                        </div>
                        <div className={`${statBgColor} px-3 py-1.5 rounded-md text-sm`}>
                          <span className={mutedTextColor}>Overdue:</span>{" "}
                          <span className={`${textColor} font-medium`}>{clientStats.overdueClients}</span>
                        </div>
                      </div>
                      {renderPagination()}
                    </div>
                  </div>
                </>
              ) : (
                <div className={`text-center p-8 ${mutedTextColor} min-h-[300px] flex items-center justify-center`}>
                  No active clients found. Add your first client to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="m-0 p-0 flex-1 flex flex-col">
            <div className={`${cardBgColor} rounded-md border ${borderColor} flex-1 flex flex-col`}>
              <div className={`p-4 border-b ${borderColor}`}>
                <h2 className={`text-lg font-medium ${textColor}`}>Archived Clients</h2>
              </div>

              {archivedClients.length > 0 ? (
                <>
                  <div className="overflow-auto">
                    {/* Desktop view - custom table */}
                    <div>
                      <div
                        className={`grid grid-cols-12 gap-2 py-2 px-4 ${headerBgColor} ${mutedTextColor} text-sm sticky top-0 z-10`}
                      >
                        <div className="col-span-3">Name</div>
                        <div className="col-span-3">Contact</div>
                        <div className="col-span-3">Plan</div>
                        <div className="col-span-2">Last Payment</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                      <div>
                        {archivedClients.map((client) => (
                          <div
                            key={client.id}
                            className={`border-b ${rowBorderColor} py-4 px-4 ${hoverBgColor} transition-colors`}
                          >
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-3">
                                <div className={`font-medium ${textColor}`}>
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className={`text-sm ${mutedTextColor}`}>{client.address}</div>
                              </div>
                              <div className="col-span-3">
                                <div className={`text-sm ${textColor}`}>{client.email}</div>
                                <div className={`text-sm ${mutedTextColor}`}>{client.phone}</div>
                              </div>
                              <div className="col-span-3">
                                <div className={`font-medium ${textColor}`}>{getPlanDisplay(client.plan)}</div>
                              </div>
                              <div className="col-span-2">
                                <div className={textColor}>
                                  {client.lastPaymentDate?.toDate ? formatDate(client.lastPaymentDate) : "No payment"}
                                </div>
                                {client.lastPaymentAmount && (
                                  <div className={`text-sm ${mutedTextColor}`}>
                                    ₱{client.lastPaymentAmount.toLocaleString()}
                                  </div>
                                )}
                              </div>
                              <div className="col-span-1 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestoreClient(client)}
                                  className={`${isDark ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-gray-100 border-gray-200 hover:bg-gray-200"} ${textColor}`}
                                >
                                  Restore
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Archived clients statistics footer */}
                  <div className={`p-4 border-t ${borderColor} ${cardBgColor} mt-auto`}>
                    <div className="flex justify-between items-center">
                      <div className={`${statBgColor} px-3 py-1.5 rounded-md text-sm`}>
                        <span className={mutedTextColor}>Total archived:</span>{" "}
                        <span className={`${textColor} font-medium`}>{archivedClients.length}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`text-center p-8 ${mutedTextColor} min-h-[300px] flex items-center justify-center`}>
                  No archived clients found.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <ClientForm
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onSubmit={handleClientFormSubmit}
        />
      )}

      {/* Edit Client Modal */}
      {showEditClientModal && selectedClient && (
        <ClientForm
          isOpen={showEditClientModal}
          onClose={() => {
            setShowEditClientModal(false)
            setSelectedClient(null)
          }}
          onSubmit={handleClientFormSubmit}
          client={selectedClient}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedClient && (
        <PaymentForm
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedClient(null)
          }}
          onSubmit={handlePaymentFormSubmit}
          client={selectedClient}
        />
      )}
    </div>
  )
}
