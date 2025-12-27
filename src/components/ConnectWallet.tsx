
'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export function ConnectWallet() {
  const { address } = useAccount();

  // Enable automatic balance watching to refresh after transactions
  // This ensures the balance updates without manual refresh
  useBalance({
    address,
    query: {
      refetchInterval: 10000, // Poll every 10 seconds for balance updates
      staleTime: 5000, // Consider data stale after 5 seconds
    },
  });

  return <ConnectButton />;
}
