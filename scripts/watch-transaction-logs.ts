import { type Address, Commitment, type Signature, type TransactionError } from '@solana/kit'

import type { SolanaClient } from 'gill'
import { createUnifiedWatcher, type UnifiedWatcherOptions, type WatcherStrategy } from './unified-watcher'

type LogsNotification = Readonly<{
  signature: Signature
  logs: readonly string[]
  err: TransactionError | null
}>

type LogsUpdate = {
  slot: bigint
  value: LogsNotification | null
}

type OnUpdate = (u: LogsUpdate) => void
type OnError = (e: unknown) => void

type WatchTransactionLogsArgs = {
  commitment?: Commitment
  mention: Address // Watch logs that mention this address
  onError?: OnError
  onUpdate: OnUpdate
  rpcSubscriptions: SolanaClient['rpcSubscriptions']
  wsConnectTimeoutMs?: number
}

/**
 * Watches Solana transaction logs for mentions of specific addresses.
 *
 * This function builds on the unified watcher and provides a resource-specific
 * strategy for transaction logs. It uses a WS subscription and does not poll.
 *
 * Consumer responsibilities:
 * - Implement any retry/backoff for persistent errors using `onError` and by
 *   calling the returned `stop` function as appropriate.
 *
 * @param args - Arguments to configure the log watcher.
 * @returns A function to stop the watcher.
 */
export const watchTransactionLogs = async ({
  rpcSubscriptions,
  commitment = 'confirmed',
  wsConnectTimeoutMs = 8000,
  mention,
  onUpdate,
  onError,
}: WatchTransactionLogsArgs) => {
  const strategy: WatcherStrategy<LogsNotification, LogsNotification> = {
    normalize: (raw) => raw ?? null,
    // No poll strategy for logs; subscribe-only.
    subscribe: async (abortSignal) => {
      return await rpcSubscriptions
        .logsNotifications({ mentions: [mention] }, { commitment })
        .subscribe({ abortSignal })
    },
  }

  const opts: UnifiedWatcherOptions<LogsNotification> = {
    onError,
    onUpdate: (slot, value) => onUpdate({ slot, value }),
    pollIntervalMs: 0, // Polling is disabled for this watcher.
    wsConnectTimeoutMs,
  }

  const { stop } = await createUnifiedWatcher(strategy, opts)
  return stop
}
