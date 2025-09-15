"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import  {PrivyProvider}  from "wallet/privy";
import {FirebaseProvider} from "wallet/firebase";
import {WalletProvider} from "wallet/walletProvider";

// 创建 QueryClient 实例
const queryClient = new QueryClient();
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        <PrivyProvider>
          <WalletProvider>
            <NextThemesProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              enableColorScheme
            >
              {children}
            </NextThemesProvider>
          </WalletProvider>
        </PrivyProvider>
      </FirebaseProvider>
    </QueryClientProvider>
  );
}
