
import { defineChain } from 'viem'

export const arc = defineChain({
  id: 5042002, // Replace with the actual chain ID for Arc Network
  name: 'Arc',
  nativeCurrency: {
    decimals: 18,
    name: 'Arc',
    symbol: 'ARC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'], // Replace with the actual RPC URL
    },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://scan.arc.network' }, // Replace with the actual block explorer URL
  },
  testnet: true,
})
