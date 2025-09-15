// src/providers/WalletProvider.tsx
'use client'

import { WagmiProvider } from '@privy-io/wagmi'
import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Your App Name' }),
    walletConnect({ projectId: 'your_walletconnect_project_id' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}