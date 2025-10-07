import { getPingDecoder, PingAccount } from '@project/anchor'
import { ellipsify } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { PingUiButtonClose } from './ping-ui-button-close'
import { PingUiButtonDecrement } from './ping-ui-button-decrement'
import { PingUiButtonIncrement } from './ping-ui-button-increment'
import { PingUiButtonSet } from './ping-ui-button-set'
import { useWatchAccount } from '@/components/solana/use-watch-account'

export function PingUiCard({ ping }: { ping: PingAccount }) {
  const { slot, account } = useWatchAccount({ accountAddress: ping.address, decoder: getPingDecoder() })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Ping: {account?.data.count} Slot: {slot}
        </CardTitle>
        <CardDescription>
          Account: <AppExplorerLink address={ping.address} label={ellipsify(ping.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <PingUiButtonIncrement ping={ping} />
          <PingUiButtonSet ping={ping} />
          <PingUiButtonDecrement ping={ping} />
          <PingUiButtonClose ping={ping} />
        </div>
      </CardContent>
    </Card>
  )
}
