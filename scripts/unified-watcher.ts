/**
 * A unified watcher abstraction that prefers WebSocket subscriptions for
 * real-time updates and automatically falls back to HTTP polling if WS is
 * unavailable or fails.
 */

export type Slot = bigint

export type SubscriptionContext = { slot: Slot }
export type SubscriptionItem<T> = { context: SubscriptionContext; value: T }

export type UnifiedWatcherOptions<TNormalized> = {
  abortController?: AbortController
  onError?: (e: unknown) => void
  onUpdate: (slot: Slot, value: TNormalized | null) => void
  pollIntervalMs?: number
  wsConnectTimeoutMs: number
}

export type WatcherStrategy<TRaw, TNormalized> = {
  normalize: (raw: TRaw | null) => TNormalized | null
  poll?: (onEmit: (update: { slot?: Slot; value: TNormalized | null }) => void, abortSignal: AbortSignal) => Promise<void>
  subscribe: (abortSignal: AbortSignal) => Promise<AsyncIterable<SubscriptionItem<TRaw> | TRaw>>
}

// Helper function to perform a single poll.
const executePoll = async <TNormalized>(
  poll: (onEmit: (update: { slot?: Slot; value: TNormalized | null }) => void, abortSignal: AbortSignal) => Promise<void>,
  onUpdate: (slot: Slot, value: TNormalized | null) => void,
  getLastSlot: () => Slot,
  closedRef: { value: boolean },
  abortSignal: AbortSignal,
  onError?: (e: unknown) => void,
) => {
  if (closedRef.value) return
  try {
    const onEmitFromPoll = ({ slot, value }: { slot?: Slot; value: TNormalized | null }) => {
      const newSlot = slot ?? getLastSlot() + 1n
      onUpdate(newSlot, value)
    }
    await poll(onEmitFromPoll, abortSignal)
  } catch (e) {
    if (!closedRef.value && onError) onError(e)
  }
}

/**
 * A unified watcher abstraction that prefers WebSocket subscriptions for
 * real-time updates and automatically falls back to HTTP polling if WS is
 * unavailable or fails.
 *
 * Flow:
 * 1. Race WS connect against a timeout.
 * 2. If WS connects:
 *    - Perform an initial poll to seed current state.
 *    - Stream updates from WS.
 *    - If WS ends or errors, fallback to polling.
 * 3. If WS connect fails (timeout/error):
 *    - Start polling immediately.
 *
 * @param strategy - Resource-specific poll/subscribe/normalize implementation.
 * @param opts - Timing and callbacks configuration.
 * @returns An object with a `stop()` function to terminate the watcher.
 */
export const createUnifiedWatcher = async <TRaw, TNormalized>(
  strategy: WatcherStrategy<TRaw, TNormalized>,
  opts: UnifiedWatcherOptions<TNormalized>,
) => {
  const { pollIntervalMs, wsConnectTimeoutMs, onUpdate, onError, abortController = new AbortController() } = opts

  const closedRef = { value: false }
  let pollTimer: NodeJS.Timeout | null = null
  let lastSlot: Slot = -1n
  const hasPoll = typeof strategy.poll === 'function'

  const stop = () => {
    if (closedRef.value) return
    closedRef.value = true
    if (pollTimer) clearInterval(pollTimer)
    abortController.abort()
  }

  const emitIfNewer = (slot: Slot, value: TNormalized | null) => {
    if (slot <= lastSlot) return
    lastSlot = slot
    onUpdate(slot, value)
  }

  const singlePoll = () => {
    if (!strategy.poll) return Promise.resolve()
    return executePoll(strategy.poll, emitIfNewer, () => lastSlot, closedRef, abortController.signal, onError)
  }

  const startPollingFallback = async () => {
    if (closedRef.value) return
    if (!hasPoll) {
      onError?.(new Error('WebSocket connection failed and no poll strategy is available. Watcher stopped.'))
      stop()
      return
    }

    await singlePoll()
    if (closedRef.value) return

    if (pollIntervalMs && pollIntervalMs > 0) {
      pollTimer = setInterval(() => void singlePoll(), pollIntervalMs)
    }
  }

  try {
    const connectPromise = strategy.subscribe(abortController.signal)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('ws connect timeout')), wsConnectTimeoutMs),
    )
    const stream = await Promise.race([connectPromise, timeoutPromise])

    if (hasPoll) {
      await singlePoll()
    }

    if (closedRef.value) {
      return { stop }
    }

    try {
      for await (const item of stream) {
        if (closedRef.value) break

        let slot: Slot
        let value: TRaw

        // Check if the item has a slot context.
        if (
          typeof item === 'object' &&
          item !== null &&
          'context' in item &&
          typeof item.context === 'object' &&
          item.context !== null &&
          'slot' in item.context
        ) {
          const subItem = item as SubscriptionItem<TRaw>
          slot = subItem.context.slot
          value = subItem.value
        } else {
          // Slot-less notification. Use a monotonic counter to ensure ordering.
          lastSlot++
          slot = lastSlot
          value = item as TRaw
        }
        emitIfNewer(slot, strategy.normalize(value))
      }

      if (!closedRef.value) {
        await startPollingFallback()
      }
    } catch (e) {
      if (!closedRef.value) {
        onError?.(e)
        await startPollingFallback()
      }
    }
  } catch (e) {
    if (!closedRef.value) {
      onError?.(e)
      await startPollingFallback()
    }
  }

  return { stop }
}