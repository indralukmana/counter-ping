import { PingAccount } from '@project/anchor'
import { ellipsify } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { PingUiButtonClose } from './ping-ui-button-close'
import { PingUiButtonDecrement } from './ping-ui-button-decrement'
import { PingUiButtonIncrement } from './ping-ui-button-increment'
import { PingUiButtonSet } from './ping-ui-button-set'

export function PingUiCard({ ping }: { ping: PingAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ping: {ping.data.count}</CardTitle>
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
