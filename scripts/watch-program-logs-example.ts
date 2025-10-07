import { watchProgramLogs } from './watch-program-logs'
import { createSolanaClient } from 'gill'
import { PING_PROGRAM_ADDRESS } from '../anchor/src/ping-exports'

const example = async () => {
  const rpcUrl = 'http://127.0.0.1:8899'

  const { rpc, rpcSubscriptions } = createSolanaClient({ urlOrMoniker: rpcUrl })

  const stop = await watchProgramLogs({
    rpc,
    rpcSubscriptions,
    programId: PING_PROGRAM_ADDRESS,
    commitment: 'confirmed',
    pollIntervalMs: 5000,
    wsConnectTimeoutMs: 8000,
    onUpdate: (u) => {
      console.log('slot', u.slot)
      console.log('programLog', u.value)
    },
    onError: (e) => console.error('watch error:', e),
  })

  setTimeout(() => stop(), 60_000)
}

await example()
