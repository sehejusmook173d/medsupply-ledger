"use client"

import { useWallet } from "@/context/wallet-context"
import {
  Activity,
  Bell,
  Box,
  Factory,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface DashboardLayoutProps {
  children: ReactNode
  role: "provider" | "manufacturer" | "distributor" | "retailer"
}

const roleIcons = {
  provider: <Package className="h-5 w-5 text-primary" />,
  manufacturer: <Factory className="h-5 w-5 text-secondary" />,
  distributor: <Truck className="h-5 w-5 text-accent" />,
  retailer: <ShoppingBag className="h-5 w-5 text-primary" />,
}

const roleTitles = {
  provider: "Raw Material Provider",
  manufacturer: "Manufacturer",
  distributor: "Distributor",
  retailer: "Retailer",
}

const roleColors = {
  provider: "primary",
  manufacturer: "secondary",
  distributor: "accent",
  retailer: "primary",
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { isConnected, disconnect, address, isHydrated } = useWallet()
  const router = useRouter()
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [notifications, setNotifications] = useState(3)

  useEffect(() => {
    setIsVisible(true)

    if (!isHydrated) return
    if (!isConnected) {
      router.push("/auth")
    }
  }, [isHydrated, isConnected, router])

  const handleLogout = () => {
    void disconnect()
  }

  const navigation = [
    { name: "Dashboard", href: `/dashboard/${role}`, icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Orders", href: `/dashboard/${role}/orders`, icon: <FileText className="h-5 w-5" /> },
    { name: "Inventory", href: `/dashboard/${role}/inventory`, icon: <Box className="h-5 w-5" /> },
    { name: "Tracking", href: `/dashboard/${role}/tracking`, icon: <Activity className="h-5 w-5" /> },
    { name: "Profile", href: `/dashboard/${role}/profile`, icon: <User className="h-5 w-5" /> },
    { name: "Settings", href: `/dashboard/${role}/settings`, icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden cyber-button">
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-r border-border/40 bg-background/95 backdrop-blur-xl">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b border-border/40 py-4">
                    <div className="relative h-8 w-8">
                      <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary to-secondary opacity-70 blur-sm"></div>
                      <div className="absolute inset-0.5 rounded-md bg-background flex items-center justify-center">
                        {roleIcons[role]}
                      </div>
                    </div>
                    <span className="text-lg font-bold tracking-tight">MedX</span>
                  </div>
                  <nav className="flex-1 space-y-2 py-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted ${
                          pathname === item.href
                            ? `bg-${roleColors[role]}/10 text-${roleColors[role]}`
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`transition-colors duration-300 ${pathname === item.href ? `text-${roleColors[role]}` : "group-hover:text-foreground"}`}
                        >
                          {item.icon}
                        </span>
                        {item.name}
                        {pathname === item.href && (
                          <div className={`ml-auto h-1.5 w-1.5 rounded-full bg-${roleColors[role]}`}></div>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="hidden items-center gap-2 md:flex">
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary to-secondary opacity-70 blur-sm"></div>
                <div className="absolute inset-0.5 rounded-md bg-background flex items-center justify-center">
                  {roleIcons[role]}
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight">MedX</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`hidden items-center gap-2 rounded-full border border-${roleColors[role]}/30 bg-${roleColors[role]}/10 px-3 py-1.5 text-sm md:flex`}
            >
              {roleIcons[role]}
              <span className={`text-${roleColors[role]}`}>{roleTitles[role]}</span>
            </div>

            <Button variant="outline" size="icon" className="relative cyber-button">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                  {notifications}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 cyber-button">
                  <div className="relative h-full w-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 opacity-70"></div>
                    <User className="h-5 w-5 relative z-10" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 backdrop-blur-xl bg-background/95 border border-border/40"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r border-border/40 bg-background/50 backdrop-blur-sm md:block">
          <div className="flex h-full flex-col">
            <nav className="flex-1 space-y-2 p-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted ${
                    pathname === item.href
                      ? `bg-${roleColors[role]}/10 text-${roleColors[role]}`
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`transition-colors duration-300 ${pathname === item.href ? `text-${roleColors[role]}` : "group-hover:text-foreground"}`}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                  {pathname === item.href && (
                    <div className={`ml-auto h-1.5 w-1.5 rounded-full bg-${roleColors[role]}`}></div>
                  )}
                </Link>
              ))}
            </nav>

            <div className="border-t border-border/40 p-4">
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  <span>Wallet connected</span>
                </div>
                <div className="mt-2 text-xs font-mono">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-auto page-transition">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
