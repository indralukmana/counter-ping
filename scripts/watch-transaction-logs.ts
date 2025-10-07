import { Commitment } from '@solana/kit'
import type { Address, Signature, SolanaClient } from 'gill'
import { createUnifiedWatcher, type UnifiedWatcherOptions, type WatcherStrategy, type Slot } from './unified-watcher'

export type TransactionLog = {
  signature: Signature
  logs: ReadonlyArray<string>
  err: unknown | null
}

export type TransactionLogsUpdate = {
  slot: Slot
  value: TransactionLog | null
}

export type OnTransactionLogsUpdate = (u: TransactionLogsUpdate) => void

export type OnTransactionLogsError = (e: unknown) => void

export type WatchTransactionLogsArgs = {
  /**
   * Optional filter for logs.
   */
  filter?: 'all' | 'allWithVotes' | { mentions: [Address] }

  /**
   * Commitment level for the WS subscription. Defaults to 'confirmed'.
   */
  commitment?: Commitment

  /**
   * Update handler receiving { slot, value }.
   */
  onUpdate: OnTransactionLogsUpdate

  /**
   * Optional error callback for non-fatal failures.
   */
  onError?: OnTransactionLogsError

  /**
   * Timeout (ms) for initial WS connection attempts. Defaults to 8000.
   */
  wsConnectTimeoutMs?: number

  /**
   * RPC subscriptions (WS) client used to subscribe to logs.
   */
  rpcSubscriptions: SolanaClient['rpcSubscriptions']

  /**
   * Maximum WS connection retries before falling back to polling. Defaults to 3.
   */
  maxRetries?: number

  /**
   * Delay (ms) between WS connection retries. Defaults to 2000.
   */
  retryDelayMs?: number
}

export type LogsFilter = 'all' | 'allWithVotes' | { mentions: [Address] }

const subscribeLogs = (
  rpcSubscriptions: SolanaClient['rpcSubscriptions'],
  filter: LogsFilter,
  commitment: Commitment,
  abortSignal: AbortSignal,
) => {
  if (filter === 'all') {
    return rpcSubscriptions.logsNotifications('all', { commitment }).subscribe({ abortSignal })
  }
  if (filter === 'allWithVotes') {
    return rpcSubscriptions.logsNotifications('allWithVotes', { commitment }).subscribe({ abortSignal })
  }
  // filter is { mentions: [Address] }
  return rpcSubscriptions.logsNotifications({ mentions: filter.mentions }, { commitment }).subscribe({ abortSignal })
}

/**
 * Watches Solana transaction logs.
 *
 */
export const watchTransactionLogs = async ({
  rpcSubscriptions,
  filter = 'all',
  commitment = 'confirmed',
  wsConnectTimeoutMs = 8000,
  onUpdate,
  onError,
  maxRetries = 3,
  retryDelayMs,
}: WatchTransactionLogsArgs) => {
  const strategy: WatcherStrategy<TransactionLog, TransactionLog> = {
    normalize: (raw) => raw ?? null,
    /**
     * No logs polling for now as there is no ready made functions in the rpc hptp
     */
    // Example outline (pseudo):
    // 1. Keep a closure cursor of last seen signature(s).
    // 2. Use rpc.getSignaturesForAddress(...) or another API to fetch new signatures.
    // 3. For each new signature, fetch getTransaction(...) and extract logs.
    // 4. Emit with synthesized or known slot:
    //    onEmit({ slot: BigInt(tx.slot), value: { signature, logs, err, slot: BigInt(tx.slot) } })
    subscribe: async (abortSignal) => {
      return await subscribeLogs(rpcSubscriptions, filter, commitment, abortSignal)
    },
  }

  const opts: UnifiedWatcherOptions<TransactionLog> = {
    onError,
    onUpdate: (slot, value) => onUpdate({ slot, value }),
    wsConnectTimeoutMs,
    maxRetries,
    retryDelayMs,
  }

  const { stop } = await createUnifiedWatcher(strategy, opts)
  return stop
}
