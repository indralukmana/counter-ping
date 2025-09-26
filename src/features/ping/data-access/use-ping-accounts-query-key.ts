import { useSolana } from '@/components/solana/use-solana'

export function usePingAccountsQueryKey() {
  const { cluster } = useSolana()

  return ['ping', 'accounts', { cluster }]
}
