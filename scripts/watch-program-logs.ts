import { Address, Commitment, Signature, SolanaClient } from 'gill'

import { createUnifiedWatcher, type Slot, type UnifiedWatcherOptions, type WatcherStrategy } from './unified-watcher'

export type ProgramLog = {
  err: unknown
  logs: ReadonlyArray<string>
  signature: Signature
}

export type ProgramLogsUpdate = {
  slot: Slot
  value: ProgramLog | null
}

export type OnProgramLogsUpdate = (u: ProgramLogsUpdate) => void

export type OnProgramLogsError = (e: unknown) => void

export type WatchProgramLogsArgs = {
  commitment?: Commitment
  maxRetries?: number
  maxSignaturesPerPoll?: number
  onError?: OnProgramLogsError
  onUpdate: OnProgramLogsUpdate
  pollIntervalMs?: number
  programId: Address
  retryDelayMs?: number
  rpc: SolanaClient['rpc']
  rpcSubscriptions: SolanaClient['rpcSubscriptions']
  wsConnectTimeoutMs?: number
}

/**
 * Watches Solana transaction logs with optimized HTTP polling fallback
 */
export const watchProgramLogs = async ({
  rpc,
  rpcSubscriptions,
  programId,
  commitment = 'confirmed',
  wsConnectTimeoutMs = 8000,
  onUpdate,
  onError,
  maxRetries = 3,
  retryDelayMs,
  pollIntervalMs = 4000,
  maxSignaturesPerPoll = 50,
}: WatchProgramLogsArgs) => {
  // Track the last processed signature to avoid duplicates
  let lastProcessedSignature: Signature | null = null

  const strategy: WatcherStrategy<ProgramLog, ProgramLog> = {
    normalize: (raw) => raw as ProgramLog,

    // EXPERIMENTAL custom polling for program id
    poll: async (onEmit, abortSignal) => {
      try {
        // Get signatures for the program address
        const signaturesResponse = await rpc
          .getSignaturesForAddress(programId, {
            commitment: 'confirmed',
            limit: maxSignaturesPerPoll,
            until: lastProcessedSignature ? lastProcessedSignature : undefined,
          })
          .send({ abortSignal })

        if (!signaturesResponse || signaturesResponse.length === 0) {
          return
        }

        for (const sigInfo of signaturesResponse.toReversed()) {
          if (abortSignal.aborted) return

          // Skip if we've already processed this signature
          if (lastProcessedSignature && sigInfo.signature === lastProcessedSignature) {
            continue
          }

          try {
            // Get the full transaction details
            const transaction = await rpc.getTransaction(sigInfo.signature).send({ abortSignal })

            if (!transaction?.meta?.logMessages) continue

            // Check if logs contain our program ID
            const hasProgramLogs = transaction.meta.logMessages.some((log) => log.includes(programId.toString()))

            if (hasProgramLogs) {
              const logData: ProgramLog = {
                err: transaction.meta.err,
                logs: transaction.meta.logMessages,
                signature: sigInfo.signature,
              }

              onEmit({
                slot: transaction.slot,
                value: logData,
              })
            }

            // Update the last processed signature
            lastProcessedSignature = sigInfo.signature
          } catch (error) {
            // Continue processing other signatures if one fails
            console.error(`Error fetching transaction ${sigInfo.signature}:`, error)
          }
        }
      } catch (error) {
        if (!abortSignal.aborted) {
          throw error
        }
      }
    },

    // WebSocket subscription for real-time updates
    subscribe: async (abortSignal) => {
      return await rpcSubscriptions
        .logsNotifications({ mentions: [programId] }, { commitment })
        .subscribe({ abortSignal })
    },
  }

  const opts: UnifiedWatcherOptions<ProgramLog> = {
    maxRetries,
    onError,
    onUpdate,
    pollIntervalMs,
    retryDelayMs,
    wsConnectTimeoutMs,
  }

  const { stop } = await createUnifiedWatcher(strategy, opts)
  return stop
}
