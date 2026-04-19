"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/context/wallet-context"
import { AlertCircle, ArrowRight, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AuthPage() {
  const {
    connect,
    isConnected,
    isHydrated,
    isConnecting,
    connectionError,
    isWrongNetwork,
    switchToAppNetwork,
  } = useWallet()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleConnect = async () => {
    await connect()
  }

  const handleSwitchNetwork = async () => {
    await switchToAppNetwork()
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center">
      <div
        className={`mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] transition-all duration-1000 ${isVisible ? "opacity-100" : "opacity-0 translate-y-10"}`}
      >
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary opacity-70 blur-lg animate-pulse"></div>
              <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to MedX</h1>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to access the blockchain-based supply chain management system
          </p>
        </div>

        {isHydrated && isConnected && isWrongNetwork && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wrong network</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <span>Switch your wallet to the network required by this app.</span>
              <Button type="button" size="sm" variant="secondary" onClick={handleSwitchNetwork}>
                Switch network
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not connect</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-30 blur-lg"></div>
          <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Connect your wallet to continue</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <Button
                onClick={handleConnect}
                className="w-full cyber-button group h-12"
                size="lg"
                disabled={isConnecting || (isConnected && isWrongNetwork)}
              >
                {isConnecting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-primary"></div>
                    <span>Connecting...</span>
                  </div>
                ) : isConnected && !isWrongNetwork ? (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    <span>Connected — continue in your app</span>
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    <span>Connect wallet</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Works with MetaMask and other browser wallets (EIP-1193).
              </p>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
              <p>By connecting your wallet, you agree to our Terms of Service and Privacy Policy.</p>
              <p className="text-[11px] leading-relaxed opacity-90">
                MedX never sees your wallet password. Only your wallet extension can ask for it (usually after you use{" "}
                <span className="text-foreground/80">Lock</span> in MetaMask or similar). Disconnecting here revokes
                site access so the next connect shows your wallet&apos;s approval prompt again.
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className="relative px-8 py-4 rounded-lg border border-border/30 bg-background/30 backdrop-blur-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary to-transparent"></div>
          <h3 className="text-sm font-medium text-primary mb-2">Why Connect a Wallet?</h3>
          <p className="text-xs text-muted-foreground">
            Your blockchain wallet serves as your secure digital identity in the MedX system, enabling you to sign
            transactions, verify product authenticity, and maintain an immutable record of all supply chain activities.
          </p>
        </div>
      </div>
    </div>
  )
}
