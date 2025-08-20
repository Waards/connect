"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, TrendingUp, Users, Download } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { getDashboardStats, getPayments, getClients } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [payments, setPayments] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6months")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsData, paymentsData, clientsData] = await Promise.all([
        getDashboardStats(),
        getPayments(),
        getClients(),
      ])

      setStats(statsData)
      setPayments(paymentsData)
      setClients(clientsData)
    } catch (error) {
      console.error("Error fetching reports data:", error)
      toast({
        title: "Error",
        description: "Failed to load reports data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Process revenue data for charts
  const processRevenueData = () => {
    const monthlyData = {}
    const now = new Date()
    const monthsToShow = timeRange === "12months" ? 12 : 6

    // Initialize months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyData[key] = {
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: 0,
        payments: 0,
      }
    }

    // Aggregate payment data
    payments.forEach((payment) => {
      const paymentDate = new Date(payment.created_at)
      const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, "0")}`

      if (monthlyData[key]) {
        monthlyData[key].revenue += payment.amount || 0
        monthlyData[key].payments += 1
      }
    })

    return Object.values(monthlyData)
  }

  // Process client status data for pie chart
  const processClientStatusData = () => {
    const statusCounts = clients.reduce((acc, client) => {
      const status = client.status || "pending"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: status === "paid" ? "#10B981" : status === "overdue" ? "#EF4444" : "#F59E0B",
    }))
  }

  // Process plan distribution data
  const processPlanData = () => {
    const planCounts = clients.reduce((acc, client) => {
      const plan = client.plan || "basic"
      acc[plan] = (acc[plan] || 0) + 1
      return acc
    }, {})

    const planNames = {
      basic: "Basic (15 Mbps)",
      standard: "Standard (25 Mbps)",
      premium: "Premium (50 Mbps)",
      enterprise: "Enterprise (100 Mbps)",
    }

    return Object.entries(planCounts).map(([plan, count]) => ({
      plan: planNames[plan] || plan,
      clients: count,
    }))
  }

  const exportReport = () => {
    const revenueData = processRevenueData()
    const csvContent = [
      ["Month/Year", "Revenue (₱)", "Number of Payments"],
      ...revenueData.map((item) => [item.month, item.revenue, item.payments]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `revenue-report-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Success",
      description: "Report exported successfully",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reports...</div>
      </div>
    )
  }

  const revenueData = processRevenueData()
  const clientStatusData = processClientStatusData()
  const planData = processPlanData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="bg-green-500 hover:bg-green-600">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats?.monthlyRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Clients</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.overdueClients || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue and payment count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: "Month/Year", position: "insideBottom", offset: -10 }} />
              <YAxis yAxisId="revenue" label={{ value: "Revenue (₱)", angle: -90, position: "insideLeft" }} />
              <YAxis
                yAxisId="payments"
                orientation="right"
                label={{ value: "Number of Payments", angle: 90, position: "insideRight" }}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === "revenue" ? `₱${value.toLocaleString()}` : value,
                  name === "revenue" ? "Revenue" : "Payments",
                ]}
              />
              <Legend />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                name="Revenue (₱)"
              />
              <Line
                yAxisId="payments"
                type="monotone"
                dataKey="payments"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Number of Payments"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Client Status Distribution</CardTitle>
            <CardDescription>Breakdown of client payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Number of clients per internet plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={planData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" label={{ value: "Internet Plans", position: "insideBottom", offset: -10 }} />
                <YAxis label={{ value: "Number of Clients", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="clients" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
