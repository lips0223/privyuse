"use client";
import { PrivyProvider as Provider } from '@privy-io/react-auth'
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import {CHAINS} from "config/chains"
import { useFirebase } from './firebase'

// import { mainnet, polygon, arbitrum, optimism } from 'viem/chains'

const chains = CHAINS

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        // 默认链
        defaultChain: chains[0],
        supportedChains: chains,
        
        // 外观配置
        appearance: {
          accentColor: '#6A6FF5',
          theme: 'light', // 'light' | 'dark'
          showWalletLoginFirst: false,
          walletList: [
            'detected_wallets',
            'metamask',
            'coinbase_wallet',
            'rainbow',
            'wallet_connect'
          ],
        },
        
        // 嵌入式钱包配置
        embeddedWallets: {
          requireUserPasswordOnCreate: false,
          showWalletUIs: true,
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        
        // 外部钱包配置
        externalWallets: {
          walletConnect: {
            enabled: true,
          },
        },
        
        // 法币入口 (可选)
        fundingMethodConfig: {
          moonpay: {
            useSandbox: process.env.NODE_ENV !== 'production',
          },
        },
      }}
    >
      <SmartWalletsProvider>
        {children}
      </SmartWalletsProvider>
    </Provider>
  )
}