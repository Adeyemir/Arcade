"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600">Arcade</span>
            </Link>
          </div>

          {/* Center: Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex flex-1 items-center justify-start ml-8">
            <MainNav />
          </div>

          {/* Right: Dashboard and Connect Wallet - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild className="text-sm text-slate-700 hover:text-blue-600">
              <Link href="/dashboard">My Dashboard</Link>
            </Button>
            <ConnectWallet />
          </div>

          {/* Mobile: Hamburger Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Shown when hamburger is clicked */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                href="/list-agent"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                List Agent
              </Link>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Faucet
              </a>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Dashboard
              </Link>
            </nav>

            {/* Mobile Connect Wallet */}
            <div className="pt-2 border-t border-slate-200">
              <ConnectWallet />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
