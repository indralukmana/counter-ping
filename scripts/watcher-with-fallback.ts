export type SubscriptionContext = { slot: bigint }
export type SubscriptionItem<T> = { context: SubscriptionContext; value: T }

export interface CreateWebsocketWatcherOptions<T> {
  wsSubscribeFn: (abortSignal: AbortSignal) => Promise<AsyncIterable<SubscriptionItem<T>>>
  pollFn: (onEmit: (slot: bigint, value: T | null) => void, abortSignal: AbortSignal) => Promise<void>
  onUpdate: (slot: bigint, value: T | null) => void
  onError?: (onError: unknown) => void
  opts: {
    wsConnectTimeoutMs: number
    pollIntervalMs: number
    heartbeatPollMs: number
  }
  closedRef: { value: boolean }
  abortController: AbortController
}

export const createWebsocketWatcherWithFallback = async <T>(
  args: CreateWebsocketWatcherOptions<T>,
): Promise<NodeJS.Timeout | null> => {
  const { wsSubscribeFn, pollFn, onUpdate, onError, opts, closedRef, abortController } = args
  const { wsConnectTimeoutMs, pollIntervalMs, heartbeatPollMs } = opts

  let pollTimer: NodeJS.Timeout | null = null

  const startPolling = async () => {
    // Initial poll
    if (!closedRef.value) {
      try {
        await pollFn(onUpdate, abortController.signal)
      } catch (e) {
        if (!closedRef.value && onError) {
          onError(e)
        }
      }
    }
    // Interval
    pollTimer = setInterval(async () => {
      if (closedRef.value) {
        return
      }
      try {
        await pollFn(onUpdate, abortController.signal)
      } catch (e) {
        if (!closedRef.value && onError) {
          onError(e)
        }
      }
    }, pollIntervalMs)
  }

  let heartbeatTimer: NodeJS.Timeout | null = null
  const startHeartbeat = () => {
    if (heartbeatPollMs <= 0) {
      return null
    }
    heartbeatTimer = setInterval(async () => {
      if (closedRef.value) {
        return
      }
      try {
        await pollFn(onUpdate, abortController.signal)
      } catch (e) {
        if (!closedRef.value && onError) {
          onError(e)
        }
      }
    }, heartbeatPollMs)
    return heartbeatTimer
  }

  const clearHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  // Race WS connect with timeout
  const connectPromise = wsSubscribeFn(abortController.signal)
  const timeoutPromise = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('ws connect timeout')), wsConnectTimeoutMs),
  )
  let heartbeatTimerInstance: NodeJS.Timeout | null = null

  try {
    const stream = await Promise.race([connectPromise, timeoutPromise])

    // Initial poll to seed
    if (!closedRef.value) {
      try {
        await pollFn(onUpdate, abortController.signal)
      } catch (e) {
        if (!closedRef.value && onError) {
          onError(e)
        }
      }
    }

    // Start heartbeat
    heartbeatTimerInstance = startHeartbeat()
    pollTimer = null // Not polling, WS is active

    console.info('=== Web Socket Subscription Started ===')

    // Consume stream
    try {
      for await (const {
        context: { slot },
        value,
      } of stream) {
        if (closedRef.value) {
          break
        }
        onUpdate(slot, value)
      }
      // If loop ends (WS closed), fallback to polling
      if (!closedRef.value) {
        clearHeartbeat()
        await startPolling()
      }
    } catch (e) {
      if (!closedRef.value && onError) {
        onError(e)
      }
      if (!closedRef.value) {
        clearHeartbeat()
        await startPolling()
      }
    }
  } catch (wsError) {
    console.log('WebSocket failed to connect, falling back to polling')
    console.error(wsError)
    await startPolling()
  }

  return pollTimer || heartbeatTimerInstance
}
