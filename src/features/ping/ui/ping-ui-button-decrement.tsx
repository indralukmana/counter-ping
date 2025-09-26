import { PingAccount } from '@project/anchor'
import { Button } from '@/components/ui/button'

import { usePingDecrementMutation } from '../data-access/use-ping-decrement-mutation'

export function PingUiButtonDecrement({ ping }: { ping: PingAccount }) {
  const decrementMutation = usePingDecrementMutation({ ping })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}
