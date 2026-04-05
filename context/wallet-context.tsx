"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ethers } from "ethers"
import { toast } from "@/hooks/use-toast"
import { getUserByAddress, registerNewUser, updateUserFields } from "@/lib/medx-mvp-store"
import type { MvpUser, SupplyRole } from "@/lib/medx-mvp-types"
import {
  ensureWalletChain,
  getInjectedEthereum,
  getTargetChainIdHex,
  getWalletErrorMessage,
  isInjectedWalletAvailable,
  revokeSiteWalletPermissions,
} from "@/lib/injected-ethereum"

function normalizeHexChainId(id: string): string {
  const s = id.toLowerCase().replace(/^0x/, "")
  return `0x${BigInt(`0x${s}`).toString(16)}`
}

interface WalletContextType {
  isHydrated: boolean
  isConnecting: boolean
  connectionError: string | null
  isConnected: boolean
  address: string | null
  chainId: string | null
  balance: string | null
  role: string | null
  userData: Record<string, unknown> | null
  /** True when NEXT_PUBLIC_CHAIN_ID is set and the wallet is on a different chain */
  isWrongNetwork: boolean
  connect: () => Promise<boolean>
  switchToAppNetwork: () => Promise<boolean>
  disconnect: () => Promise<void>
  checkUserRegistration: (address: string) => Promise<Record<string, unknown> | null>
  registerUser: (userData: Record<string, unknown> & { walletAddress: string }) => Promise<void>
  updateUserProfile: (
    walletAddress: string,
    data: Record<string, unknown>
  ) => Promise<Record<string, unknown>>
}

const WalletContext = createContext<WalletContextType | null>(null)

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return ctx
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const addressRef = useRef<string | null>(null)
  addressRef.current = address

  const targetChainHex = useMemo(() => getTargetChainIdHex(), [])

  const isWrongNetwork = useMemo(() => {
    if (!targetChainHex || !chainId) return false
    try {
      return normalizeHexChainId(chainId) !== targetChainHex
    } catch {
      return false
    }
  }, [chainId, targetChainHex])

  const getBalance = useCallback(async (addr: string) => {
    const eth = getInjectedEthereum()
    if (!eth) return null
    try {
      const provider = new ethers.BrowserProvider(eth)
      const bal = await provider.getBalance(addr)
      return ethers.formatEther(bal)
    } catch (error) {
      console.error("Error getting balance:", error)
      return null
    }
  }, [])

  const checkUserRegistration = useCallback(async (addr: string) => {
    const u = getUserByAddress(addr)
    if (u) {
      const data = { ...u } as Record<string, unknown>
      setRole(u.role)
      setUserData(data)
      return data
    }
    setRole(null)
    setUserData(null)
    return null
  }, [])

  const updateUserProfile = useCallback(async (walletAddress: string, data: Record<string, unknown>) => {
    const updatedUser = updateUserFields(
      walletAddress,
      data as Partial<Omit<MvpUser, "address" | "walletAddress">>
    )
    if (!updatedUser) {
      throw new Error("User not found")
    }
    const updated = { ...updatedUser } as Record<string, unknown>
    setUserData(updated)
    setRole(updatedUser.role)
    return updated
  }, [])

  const registerUser = useCallback(
    async (data: Record<string, unknown> & { walletAddress: string }) => {
      const existing = getUserByAddress(data.walletAddress)
      if (existing) {
        setUserData({ ...existing } as Record<string, unknown>)
        setRole(existing.role)
        router.push(`/dashboard/${existing.role}`)
        return
      }

      const role = data.role
      if (typeof role !== "string" || !["provider", "manufacturer", "distributor", "retailer"].includes(role)) {
        throw new Error("Invalid role")
      }

      const created = registerNewUser({
        walletAddress: data.walletAddress,
        role: role as SupplyRole,
        name: String(data.name ?? ""),
        companyName: String(data.companyName ?? ""),
        email: String(data.email ?? ""),
        phone: data.phone !== undefined ? String(data.phone) : undefined,
        location: data.location !== undefined ? String(data.location) : undefined,
        registrationId: data.registrationId !== undefined ? String(data.registrationId) : undefined,
        licenseNumber: data.licenseNumber !== undefined ? String(data.licenseNumber) : undefined,
      })

      setUserData({ ...created } as Record<string, unknown>)
      setRole(created.role)
      router.push(`/dashboard/${created.role}`)
    },
    [router]
  )

  const navigateAfterConnect = useCallback(
    async (addr: string) => {
      const user = await checkUserRegistration(addr)
      const r = user?.role
      if (user && typeof r === "string") {
        router.replace(`/dashboard/${r}`)
      } else {
        router.replace("/auth/role")
      }
    },
    [checkUserRegistration, router]
  )

  const disconnect = useCallback(async () => {
    const eth = getInjectedEthereum()
    if (eth) {
      await revokeSiteWalletPermissions(eth)
    }
    setIsConnected(false)
    setAddress(null)
    setChainId(null)
    setBalance(null)
    setRole(null)
    setUserData(null)
    setConnectionError(null)
    router.push("/")
    toast({
      title: "Disconnected from MedX",
      description:
        "This site no longer has permission to use your accounts. Next time you connect, your wallet will ask again. Your wallet password is only requested when you lock your wallet in MetaMask (or your wallet app)—not by websites.",
    })
  }, [router])

  const switchToAppNetwork = useCallback(async (): Promise<boolean> => {
    const eth = getInjectedEthereum()
    if (!eth || !targetChainHex) return false
    try {
      await ensureWalletChain(eth)
      const cid = (await eth.request({ method: "eth_chainId" })) as string
      setChainId(cid)
      const addr = addressRef.current
      if (addr) {
        setBalance(await getBalance(addr))
      }
      toast({ title: "Network updated", description: "Your wallet is on the correct network." })
      return true
    } catch (error) {
      const msg = getWalletErrorMessage(error)
      toast({ variant: "destructive", title: "Network switch failed", description: msg })
      return false
    }
  }, [getBalance, targetChainHex])

  const connect = useCallback(async (): Promise<boolean> => {
    setConnectionError(null)

    if (!isInjectedWalletAvailable()) {
      const msg = "No wallet detected. Install MetaMask or another EIP-1193 wallet, then try again."
      setConnectionError(msg)
      toast({
        variant: "destructive",
        title: "Wallet not found",
        description: msg,
      })
      return false
    }

    const eth = getInjectedEthereum()!
    setIsConnecting(true)

    try {
      if (targetChainHex) {
        await ensureWalletChain(eth)
      }

      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[]
      if (!accounts.length) {
        const msg = "No account returned from your wallet."
        setConnectionError(msg)
        toast({ variant: "destructive", title: "Connection failed", description: msg })
        return false
      }

      const currentAddress = accounts[0]
      setAddress(currentAddress)
      setIsConnected(true)

      const [cid, bal] = await Promise.all([
        eth.request({ method: "eth_chainId" }) as Promise<string>,
        getBalance(currentAddress),
      ])
      setChainId(cid)
      setBalance(bal)

      await navigateAfterConnect(currentAddress)
      toast({ title: "Wallet connected", description: `${currentAddress.slice(0, 6)}…${currentAddress.slice(-4)}` })
      return true
    } catch (error) {
      const msg = getWalletErrorMessage(error)
      setConnectionError(msg)
      toast({ variant: "destructive", title: "Connection failed", description: msg })
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [getBalance, navigateAfterConnect, targetChainHex])

  // Restore session from wallet (no navigation — avoids hijacking the landing page)
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const eth = getInjectedEthereum()
      if (!eth) {
        if (!cancelled) setIsHydrated(true)
        return
      }

      try {
        const accounts = (await eth.request({ method: "eth_accounts" })) as string[]
        if (cancelled) return

        if (accounts.length > 0) {
          const addr = accounts[0]
          setAddress(addr)
          setIsConnected(true)
          const [cid, bal] = await Promise.all([
            eth.request({ method: "eth_chainId" }) as Promise<string>,
            getBalance(addr),
          ])
          if (cancelled) return
          setChainId(cid)
          setBalance(bal)
          await checkUserRegistration(addr)
        }
      } catch (e) {
        console.error("Wallet hydrate error:", e)
      } finally {
        if (!cancelled) setIsHydrated(true)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [checkUserRegistration, getBalance])

  // EIP-1193 events (stable subscription — no `address` in deps)
  useEffect(() => {
    const eth = getInjectedEthereum()
    if (!eth?.on || !eth.removeListener) return

    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[]
      if (!list?.length) {
        void disconnect()
        return
      }
      const next = list[0]
      setAddress(next)
      setIsConnected(true)
      void (async () => {
        setBalance(await getBalance(next))
        const user = await checkUserRegistration(next)
        const role = user?.role
        const roleOk = user && typeof role === "string"
        if (pathname?.startsWith("/dashboard")) {
          if (roleOk) {
            router.replace(`/dashboard/${role}`)
          } else {
            router.replace("/auth/role")
          }
        }
        if (pathname === "/auth" || pathname === "/auth/role") {
          if (roleOk) {
            router.replace(`/dashboard/${role}`)
          } else if (pathname === "/auth") {
            router.replace("/auth/role")
          }
        }
      })()
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    eth.on("accountsChanged", handleAccountsChanged)
    eth.on("chainChanged", handleChainChanged)

    return () => {
      eth.removeListener!("accountsChanged", handleAccountsChanged)
      eth.removeListener!("chainChanged", handleChainChanged)
    }
  }, [checkUserRegistration, disconnect, getBalance, pathname, router])

  // If user opens /auth while already connected, send them to the right place
  useEffect(() => {
    if (!isHydrated || !isConnected || !address) return
    if (pathname !== "/auth") return

    let cancelled = false
    void (async () => {
      const user = await checkUserRegistration(address)
      if (cancelled) return
      const r = user?.role
      if (user && typeof r === "string") {
        router.replace(`/dashboard/${r}`)
      } else {
        router.replace("/auth/role")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isHydrated, isConnected, address, pathname, checkUserRegistration, router])

  const contextValue = useMemo<WalletContextType>(
    () => ({
      isHydrated,
      isConnecting,
      connectionError,
      isConnected,
      address,
      chainId,
      balance,
      role,
      userData,
      isWrongNetwork,
      connect,
      switchToAppNetwork,
      disconnect,
      checkUserRegistration,
      registerUser,
      updateUserProfile,
    }),
    [
      isHydrated,
      isConnecting,
      connectionError,
      isConnected,
      address,
      chainId,
      balance,
      role,
      userData,
      isWrongNetwork,
      connect,
      switchToAppNetwork,
      disconnect,
      checkUserRegistration,
      registerUser,
      updateUserProfile,
    ]
  )

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
}
