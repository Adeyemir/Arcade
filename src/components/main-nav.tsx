import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600"
      >
        Marketplace
      </Link>
      <Link
        href="/list-agent"
        className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600"
      >
        List Agent
      </Link>
      <a
        href="https://faucet.circle.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-600"
      >
        Faucet
      </a>
    </nav>
  )
}
