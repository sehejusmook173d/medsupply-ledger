import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/context/wallet-context"
import { MedxDataProvider } from "@/context/medx-data-context"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MedX - Blockchain Supply Chain",
  description: "Blockchain-based supply chain management system for medicines",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <MedxDataProvider>
            <WalletProvider>
              <div className="min-h-screen bg-gradient-to-b from-background/95 to-background/80 backdrop-blur">
                {children}
                <div className="fixed inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                <Toaster />
              </div>
            </WalletProvider>
          </MedxDataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}