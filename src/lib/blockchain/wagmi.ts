
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { arc } from './arc'

export const config = createConfig({
  chains: [mainnet, sepolia, arc],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arc.id]: http(),
  },
})
