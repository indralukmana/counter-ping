import { address } from '@solana/addresses'
import { watchAccount } from './watch-account'
import { createSolanaClient } from 'gill'

const example = async () => {
  const rpcUrl = 'http://127.0.0.1:8899'
  // const wsUrl = 'ws://127.0.0.1:8900'

  const { rpc, rpcSubscriptions } = createSolanaClient({ urlOrMoniker: rpcUrl })

  const stop = await watchAccount({
    rpc,
    rpcSubscriptions,
    accountAddress: address('8AUarqzmzgDueYZjxoT7v7UkK3NrCPCUAAZ5zrYgoEya'),
    commitment: 'confirmed',
    pollIntervalMs: 5000,
    wsConnectTimeoutMs: 8000,
    onUpdate: (u) => {
      console.log('slot', u.slot)
      console.log('accountInfo', u.value)
    },
    onError: (e) => console.error('watch error:', e),
  })

  setTimeout(() => stop(), 60_000)
}

await example()
