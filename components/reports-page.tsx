"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function ReportsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("revenue")

  // Data states
  const [clients, setClients] = useState([])
  const [payments, setPayments] = useState([])

  // Derived data states
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [clientStats, setClientStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    planDistribution: [],
  })
  const [paymentStats, setPaymentStats] = useState({
    total: 0,
    average: 0,
    methodDistribution: [],
  })

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch clients
      const clientsSnapshot = await getDocs(collection(db, "clients"))
      const clientsList = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setClients(clientsList)

      // Fetch payments
      const paymentsSnapshot = await getDocs(collection(db, "payments"))
      const paymentsList = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPayments(paymentsList)

      // Process data
      processData(clientsList, paymentsList)
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Process data for reports
  const processData = (clientsList, paymentsList) => {
    // Process client stats
    const activeClients = clientsList.filter((client) => client.isConnected)
    const inactiveClients = clientsList.filter((client) => !client.isConnected)

    // Plan distribution
    const planCounts = {}
    clientsList.forEach((client) => {
      const plan = client.plan || "basic"
      planCounts[plan] = (planCounts[plan] || 0) + 1
    })

    const planDistribution = Object.keys(planCounts).map((plan) => ({
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      value: planCounts[plan],
    }))

    setClientStats({
      total: clientsList.length,
      active: activeClients.length,
      inactive: inactiveClients.length,
      planDistribution,
    })

    // Process payment stats
    const totalRevenue = paymentsList.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const averagePayment = paymentsList.length > 0 ? totalRevenue / paymentsList.length : 0

    // Payment method distribution
    const methodCounts = {}
    paymentsList.forEach((payment) => {
      const method = payment.paymentMethod || "cash"
      methodCounts[method] = (methodCounts[method] || 0) + 1
    })

    const methodDistribution = Object.keys(methodCounts).map((method) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: methodCounts[method],
    }))

    setPaymentStats({
      total: totalRevenue,
      average: averagePayment,
      methodDistribution,
    })

    // Process monthly revenue
    const monthlyData = {}

    paymentsList.forEach((payment) => {
      if (payment.created_at && payment.created_at.toDate) {
        const date = payment.created_at.toDate()
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: monthYear,
            revenue: 0,
            count: 0,
          }
        }

        monthlyData[monthYear].revenue += payment.amount || 0
        monthlyData[monthYear].count += 1
      }
    })

    // Convert to array and sort by date
    const monthlyRevenueData = Object.values(monthlyData)
    monthlyRevenueData.sort((a, b) => {
      const [aMonth, aYear] = a.month.split("/")
      const [bMonth, bYear] = b.month.split("/")

      if (aYear !== bYear) return aYear - bYear
      return aMonth - bMonth
    })

    setMonthlyRevenue(monthlyRevenueData)
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (loading) {
    return <div className="p-8">Loading report data...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 flex-1 overflow-y-auto overflow-x-hidden">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, "Revenue"]} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue (₱)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₱{paymentStats.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Payment</p>
                      <p className="text-2xl font-bold">₱{paymentStats.average.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                      <p className="text-2xl font-bold">{payments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentStats.methodDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentStats.methodDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Clients</p>
                      <p className="text-2xl font-bold">{clientStats.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Connections</p>
                      <p className="text-2xl font-bold">{clientStats.active}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Inactive Connections</p>
                      <p className="text-2xl font-bold">{clientStats.inactive}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientStats.planDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {clientStats.planDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Clients"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <p className="text-2xl font-bold">{payments.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₱{paymentStats.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Payment</p>
                    <p className="text-2xl font-bold">₱{paymentStats.average.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-8 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, "Count"]} />
                      <Legend />
                      <Bar dataKey="count" name="Number of Payments" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
