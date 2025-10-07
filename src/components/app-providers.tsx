import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { SolanaProvider as GillSolanaProvider } from '@gillsdk/react'
import React from 'react'
import { createSolanaClient } from 'gill'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const client = createSolanaClient({
    urlOrMoniker: 'localnet',
  })

  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SolanaProvider>
          <GillSolanaProvider client={client}>{children}</GillSolanaProvider>
        </SolanaProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
