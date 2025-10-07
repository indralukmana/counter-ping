import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Account,
  Address,
  assertAccountExists,
  Commitment,
  decodeAccount,
  Decoder,
  MaybeEncodedAccount,
  parseBase64RpcAccount,
} from 'gill'
import { watchAccount } from '../../../scripts/watch-account'
import { useSolanaClient } from '@gillsdk/react'

type UseWatchedAccountOptions<TDecodedData extends object = Uint8Array> = {
  accountAddress: Address
  commitment?: Commitment
  pollIntervalMs?: number
  wsConnectTimeoutMs?: number
  maxRetries?: number
  retryDelayMs?: number
  decoder?: Decoder<TDecodedData>
}

export function useWatchAccount<TDecodedData extends object = Uint8Array>(
  inputOptions: UseWatchedAccountOptions<TDecodedData>,
) {
  const { accountAddress, decoder, ...rawOptions } = inputOptions
  const queryClient = useQueryClient()
  const stopWatcherRef = useRef<(() => void) | null>(null)
  const decoderRef = useRef(decoder)
  decoderRef.current = decoder

  const { rpc, rpcSubscriptions } = useSolanaClient()

  // Memoize options to make them stable
  const options = useMemo(
    () => ({
      commitment: rawOptions.commitment,
      pollIntervalMs: rawOptions.pollIntervalMs,
      wsConnectTimeoutMs: rawOptions.wsConnectTimeoutMs,
      maxRetries: rawOptions.maxRetries,
      retryDelayMs: rawOptions.retryDelayMs,
    }),
    [
      rawOptions.commitment,
      rawOptions.pollIntervalMs,
      rawOptions.wsConnectTimeoutMs,
      rawOptions.maxRetries,
      rawOptions.retryDelayMs,
    ],
  )

  // Initial data fetch with React Query
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['account', accountAddress],
    queryFn: async () => {
      const { context, value } = await rpc.getAccountInfo(accountAddress, { encoding: 'base64' }).send()
      const encodedAccount = parseBase64RpcAccount(accountAddress, value)
      const slot = context.slot
      assertAccountExists(encodedAccount)
      if (decoderRef.current) {
        const decodedAccount = decodeAccount(encodedAccount, decoderRef.current)
        return { value: decodedAccount, slot }
      }
      return { value: encodedAccount, slot }
    },
    staleTime: 30000,
  })

  // Memoize callbacks to prevent effect re-runs
  const onUpdate = useCallback(
    (newData: { slot: bigint; value: MaybeEncodedAccount | null }) => {
      console.log({ newData })
      if (!newData.value) {
        queryClient.setQueryData(['account', accountAddress], newData)
        return
      }
      const encodedAccount = newData.value
      assertAccountExists(encodedAccount)
      if (decoderRef.current) {
        const decodedAccount = decodeAccount(encodedAccount, decoderRef.current)
        queryClient.setQueryData(['account', accountAddress], { ...newData, value: decodedAccount })
        return
      }
      queryClient.setQueryData(['account', accountAddress], newData)
    },
    [queryClient, accountAddress],
  )

  const onError = useCallback(
    (error: unknown) => {
      console.error('Account watch error:', error)
      // Invalidate the query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['account', accountAddress] })
    },
    [queryClient, accountAddress],
  )

  // Real-time updates
  useEffect(() => {
    const startWatching = async () => {
      const stop = await watchAccount({
        rpc,
        rpcSubscriptions,
        accountAddress,
        onUpdate,
        onError,
        ...options,
      })

      stopWatcherRef.current = stop
    }

    startWatching()

    return () => {
      if (stopWatcherRef.current) {
        stopWatcherRef.current()
      }
    }
  }, [accountAddress, options, rpc, rpcSubscriptions, onUpdate, onError])

  return {
    slot: data?.slot,
    account: data?.value as Account<TDecodedData, string>,
    isLoading,
    error,
    refetch,
  }
}
