import { useQueryClient } from '@tanstack/react-query'
import { usePingAccountsQueryKey } from './use-ping-accounts-query-key'

export function usePingAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = usePingAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}
