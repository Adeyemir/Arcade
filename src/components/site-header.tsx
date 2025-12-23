import Link from "next/link"

import { MainNav } from "@/components/main-nav"
import { ConnectWallet } from "@/components/ConnectWallet" // Assuming this component exists
import { Button } from "@/components/ui/button" // Assuming this component exists and is shadcn/ui button

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Left: Logo */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-blue-600">Arcade</span>
          </Link>
        </div>

        {/* Center: Main Navigation */}
        <div className="flex flex-1 items-center justify-center space-x-2">
          <MainNav />
        </div>

        {/* Right: Dashboard and Connect Wallet */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            {/* My Dashboard button - conditionally rendered based on login status */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                My Dashboard
              </Link>
            </Button>
            <ConnectWallet />
          </nav>
        </div>
      </div>
    </header>
  )
}
