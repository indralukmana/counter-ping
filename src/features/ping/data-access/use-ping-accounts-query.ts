import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getPingProgramAccounts } from '@project/anchor'
import { usePingAccountsQueryKey } from './use-ping-accounts-query-key'

export function usePingAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: usePingAccountsQueryKey(),
    queryFn: async () => await getPingProgramAccounts(client.rpc),
  })
}
