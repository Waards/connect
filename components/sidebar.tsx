"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { logoutUser } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Close mobile sidebar when navigating
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [pathname, isMobile])

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login") // Redirect to login page after logout
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Determine background color based on theme
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-700"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"
  const hoverBgColor = theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
  const activeBgColor = theme === "dark" ? "bg-gray-800" : "bg-gray-100"

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile sidebar */}
        <div
          className={`fixed inset-0 z-40 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:hidden`}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileOpen(false)} />

          {/* Sidebar content */}
          <div className={`relative w-64 h-full ${bgColor} ${borderColor} border-r flex flex-col`}>
            <div className={`p-6 border-b ${borderColor}`}>
              <h1 className="text-xl font-bold text-primary">InsightTrack</h1>
              <p className="text-xs text-muted-foreground">IncConnect Solution Corp</p>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard"
                    className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                      pathname === "/dashboard" ? activeBgColor : ""
                    }`}
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/clients"
                    className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                      pathname.startsWith("/clients") ? activeBgColor : ""
                    }`}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    Clients
                  </Link>
                </li>
                <li>
                  <Link
                    href="/payments"
                    className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                      pathname.startsWith("/payments") ? activeBgColor : ""
                    }`}
                  >
                    <CreditCard className="mr-3 h-5 w-5" />
                    Payments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reports"
                    className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                      pathname.startsWith("/reports") ? activeBgColor : ""
                    }`}
                  >
                    <BarChart3 className="mr-3 h-5 w-5" />
                    Reports
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                      pathname.startsWith("/settings") ? activeBgColor : ""
                    }`}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
            <div className={`p-4 border-t ${borderColor} mt-auto`}>
              <button
                onClick={handleLogout}
                className={`flex items-center p-2 w-full rounded-md ${hoverBgColor} ${textColor} font-medium`}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div
      className={`${collapsed ? "w-16" : "w-64"} ${bgColor} ${borderColor} border-r h-screen flex flex-col transition-all duration-300 ease-in-out relative shrink-0`}
    >
      {/* Toggle button */}
      <button
        className={`absolute -right-3 top-20 ${bgColor} ${borderColor} border rounded-full p-1 z-10`}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-primary" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-primary" />
        )}
      </button>

      <div className={`p-6 border-b ${borderColor} ${collapsed ? "flex justify-center items-center p-3" : ""}`}>
        {collapsed ? (
          <h1 className="text-xl font-bold text-primary">IT</h1>
        ) : (
          <>
            <h1 className="text-xl font-bold text-primary">InsightTrack</h1>
            <p className="text-xs text-muted-foreground">IncConnect Solution Corp</p>
          </>
        )}
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                pathname === "/dashboard" ? activeBgColor : ""
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Dashboard" : ""}
            >
              <LayoutDashboard className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/clients"
              className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                pathname.startsWith("/clients") ? activeBgColor : ""
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Clients" : ""}
            >
              <Users className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
              {!collapsed && <span>Clients</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/payments"
              className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                pathname.startsWith("/payments") ? activeBgColor : ""
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Payments" : ""}
            >
              <CreditCard className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
              {!collapsed && <span>Payments</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/reports"
              className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                pathname.startsWith("/reports") ? activeBgColor : ""
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Reports" : ""}
            >
              <BarChart3 className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
              {!collapsed && <span>Reports</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className={`flex items-center p-2 rounded-md ${hoverBgColor} ${textColor} font-medium ${
                pathname.startsWith("/settings") ? activeBgColor : ""
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? "Settings" : ""}
            >
              <Settings className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
              {!collapsed && <span>Settings</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className={`p-4 border-t ${borderColor} mt-auto`}>
        <button
          onClick={handleLogout}
          className={`flex items-center p-2 w-full rounded-md ${hoverBgColor} ${textColor} font-medium ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut className={`${collapsed ? "" : "mr-3"} h-5 w-5`} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
