"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("account")

  // Account settings
  const [accountForm, setAccountForm] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Company settings
  const [companyForm, setCompanyForm] = useState({
    companyName: "IncConnect Solution Corp",
    address: "123 Main Street, City",
    phone: "+63 123 456 7890",
    email: "info@incconnect.com",
    website: "www.incconnect.com",
  })

  // System settings - initialize with current theme state
  const [systemSettings, setSystemSettings] = useState({
    autoDisconnect: true,
    paymentReminders: true,
    darkMode: theme === "dark", // Set based on current theme
    dataBackup: false,
  })

  // Update darkMode setting when theme changes
  useEffect(() => {
    setSystemSettings((prev) => ({
      ...prev,
      darkMode: theme === "dark",
    }))
  }, [theme])

  // Loading states
  const [accountLoading, setAccountLoading] = useState(false)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [systemLoading, setSystemLoading] = useState(false)

  // Handle account form change
  const handleAccountChange = (e) => {
    const { name, value } = e.target
    setAccountForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle company form change
  const handleCompanyChange = (e) => {
    const { name, value } = e.target
    setCompanyForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle system settings change
  const handleSystemChange = (name, value) => {
    setSystemSettings((prev) => ({ ...prev, [name]: value }))

    // Toggle theme when the darkMode switch is changed
    if (name === "darkMode") {
      setTheme(value ? "dark" : "light")
    }
  }

  // Handle account form submit
  const handleAccountSubmit = (e) => {
    e.preventDefault()
    setAccountLoading(true)

    // Validate passwords
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      setAccountLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Account Updated",
        description: "Your account information has been updated successfully.",
      })
      setAccountLoading(false)
    }, 1000)
  }

  // Handle company form submit
  const handleCompanySubmit = (e) => {
    e.preventDefault()
    setCompanyLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Company Updated",
        description: "Company information has been updated successfully.",
      })
      setCompanyLoading(false)
    }, 1000)
  }

  // Handle system settings submit
  const handleSystemSubmit = (e) => {
    e.preventDefault()
    setSystemLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Settings Updated",
        description: "System settings have been updated successfully.",
      })
      setSystemLoading(false)
    }, 1000)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account information and password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={accountForm.displayName}
                      onChange={handleAccountChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={accountForm.email}
                      onChange={handleAccountChange}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={accountForm.currentPassword}
                        onChange={handleAccountChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={accountForm.newPassword}
                        onChange={handleAccountChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={accountForm.confirmPassword}
                        onChange={handleAccountChange}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={accountLoading}>
                  {accountLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={companyForm.companyName}
                    onChange={handleCompanyChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={companyForm.address} onChange={handleCompanyChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={companyForm.phone} onChange={handleCompanyChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={companyForm.email}
                      onChange={handleCompanyChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" value={companyForm.website} onChange={handleCompanyChange} />
                </div>

                <Button type="submit" disabled={companyLoading}>
                  {companyLoading ? "Saving..." : "Save Company Information"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system behavior and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSystemSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoDisconnect">Auto Disconnect</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically disconnect clients when payment is overdue
                      </p>
                    </div>
                    <Switch
                      id="autoDisconnect"
                      checked={systemSettings.autoDisconnect}
                      onCheckedChange={(value) => handleSystemChange("autoDisconnect", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="paymentReminders">Payment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Send automatic payment reminders to clients</p>
                    </div>
                    <Switch
                      id="paymentReminders"
                      checked={systemSettings.paymentReminders}
                      onCheckedChange={(value) => handleSystemChange("paymentReminders", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Use dark theme for the application</p>
                    </div>
                    <Switch
                      id="darkMode"
                      checked={systemSettings.darkMode}
                      onCheckedChange={(value) => handleSystemChange("darkMode", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dataBackup">Automatic Backup</Label>
                      <p className="text-sm text-muted-foreground">Enable automatic data backup</p>
                    </div>
                    <Switch
                      id="dataBackup"
                      checked={systemSettings.dataBackup}
                      onCheckedChange={(value) => handleSystemChange("dataBackup", value)}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={systemLoading}>
                  {systemLoading ? "Saving..." : "Save System Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
