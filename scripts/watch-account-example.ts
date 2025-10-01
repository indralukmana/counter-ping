import { address } from 'gill'
import { watchAccount } from './watch-account'

const example = async () => {
  const stop = await watchAccount(
    {
      rpcUrl: 'http://127.0.0.1:8899',
      wsUrl: 'ws://127.0.0.1:8900',
      accountAddress: address('AsrWSULSkdWN6caWGuYxiyWMivcofxk835QRreZydzfH'),
      commitment: 'confirmed',
      pollIntervalMs: 5000,
      wsConnectTimeoutMs: 8000,
      heartbeatPollMs: 30000,
    },
    (u) => {
      console.log('slot', u.slot)
      console.log('accountInfo', u.value)
    },
    (e) => console.error('watch error:', e),
  )

  setTimeout(() => stop(), 60_000)
}

await example()
