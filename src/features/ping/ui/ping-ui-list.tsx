import { PingUiCard } from './ping-ui-card'
import { usePingAccountsQuery } from '@/features/ping/data-access/use-ping-accounts-query'

export function PingUiList() {
  const pingAccountsQuery = usePingAccountsQuery()

  if (pingAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!pingAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {pingAccountsQuery.data?.map((ping) => (
        <PingUiCard key={ping.address} ping={ping} />
      ))}
    </div>
  )
}
