"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/context/wallet-context"
import { Factory, Package, ShoppingBag, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

type Role = "provider" | "manufacturer" | "distributor" | "retailer"

interface RoleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
  color: string
}

function RoleCard({ title, description, icon, selected, onClick, color }: RoleCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 backdrop-blur-sm ${
        selected
          ? `border-${color} bg-${color}/5 shadow-lg`
          : "border-border/50 bg-background/50 hover:border-border hover:bg-background/80"
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-${color}/10 transition-all duration-300 ${selected ? "scale-110" : ""}`}
          >
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {selected && <div className={`h-1 w-full bg-${color}`}></div>}
    </Card>
  )
}

export default function RoleSelectionPage() {
  const { isConnected, address, registerUser, checkUserRegistration, isHydrated } = useWallet()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    location: "",
    registrationId: "",
    licenseNumber: "",
  })

  // Check for existing user and handle redirects
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!isHydrated) return
      if (!isConnected) {
        router.push("/auth")
        return
      }

      if (address) {
        try {
          const user = await checkUserRegistration(address)
          if (user) {
            // User exists, redirect to dashboard
            router.push(`/dashboard/${user.role}`)
            return
          }
          // Only show the role selection if user doesn't exist
          setIsVisible(true)
        } catch (error) {
          console.error("Error checking user registration:", error)
        }
      }
    }

    checkAndRedirect()
  }, [isHydrated, isConnected, address, router, checkUserRegistration])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (selectedRole) {
      setShowForm(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || !selectedRole) return

    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.companyName || !formData.email) {
        throw new Error("Please fill in all required fields")
      }

      await registerUser({
        walletAddress: address,
        role: selectedRole,
        ...formData,
      })
    } catch (error: any) {
      console.error("Error registering user:", error)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to register user. Please try again.",
      })
      setIsLoading(false)
    }
  }

  // Don't render anything if not connected or if user exists (will be redirected)
  if (!isConnected || !isVisible) {
    return null
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center">
      <div
        className={`mx-auto flex w-full max-w-3xl flex-col justify-center space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100" : "opacity-0 translate-y-10"}`}
      >
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary opacity-70 blur-lg"></div>
              <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {showForm ? "Complete Your Profile" : "Select Your Role"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showForm
              ? "Please provide your information to complete registration"
              : "Choose your role in the pharmaceutical supply chain to access relevant features"}
          </p>
        </div>

        {!showForm ? (
          // Role selection screen
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <RoleCard
                title="Raw Material Provider"
                description="Supply raw materials to manufacturers"
                icon={<Package className="h-5 w-5 text-primary" />}
                selected={selectedRole === "provider"}
                onClick={() => handleRoleSelect("provider")}
                color="primary"
              />
              <RoleCard
                title="Manufacturer"
                description="Produce medicines from raw materials"
                icon={<Factory className="h-5 w-5 text-secondary" />}
                selected={selectedRole === "manufacturer"}
                onClick={() => handleRoleSelect("manufacturer")}
                color="secondary"
              />
              <RoleCard
                title="Distributor"
                description="Distribute medicines to retailers"
                icon={<Truck className="h-5 w-5 text-accent" />}
                selected={selectedRole === "distributor"}
                onClick={() => handleRoleSelect("distributor")}
                color="accent"
              />
              <RoleCard
                title="Retailer"
                description="Sell medicines to consumers"
                icon={<ShoppingBag className="h-5 w-5 text-primary" />}
                selected={selectedRole === "retailer"}
                onClick={() => handleRoleSelect("retailer")}
                color="primary"
              />
            </div>

            <Button
              onClick={handleContinue}
              disabled={!selectedRole}
              size="lg"
              className={`mx-auto w-full max-w-xs h-12 cyber-button group transition-all duration-300 ${
                selectedRole ? "opacity-100" : "opacity-50"
              }`}
            >
              <span className="relative z-10">Continue</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10 ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </>
        ) : (
          // Registration form
          <div className="relative">
            <div
              className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-primary to-secondary opacity-30 blur-sm`}
            ></div>
            <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Registration Information</CardTitle>
                <CardDescription>Please fill out your details to complete registration</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Smith"
                      required
                      className="border-border/50 bg-background/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Your Company Inc."
                      required
                      className="border-border/50 bg-background/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@company.com"
                      required
                      className="border-border/50 bg-background/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="border-border/50 bg-background/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, Country"
                      className="border-border/50 bg-background/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationId">Registration ID</Label>
                    <Input
                      id="registrationId"
                      name="registrationId"
                      value={formData.registrationId}
                      onChange={handleInputChange}
                      placeholder="RM-1234-5678"
                      className="border-border/50 bg-background/50 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="FDA-12345"
                      className="border-border/50 bg-background/50 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="cyber-button">
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="cyber-button">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-primary"></div>
                        <span>Registering...</span>
                      </div>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        <div className="relative px-4 py-3 rounded-lg border border-border/30 bg-background/30 backdrop-blur-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary to-transparent"></div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            <p className="text-xs text-primary">
              Connected wallet: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
