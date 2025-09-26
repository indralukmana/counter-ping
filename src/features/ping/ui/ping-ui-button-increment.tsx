import { PingAccount } from '@project/anchor'
import { Button } from '@/components/ui/button'
import { usePingIncrementMutation } from '../data-access/use-ping-increment-mutation'

export function PingUiButtonIncrement({ ping }: { ping: PingAccount }) {
  const incrementMutation = usePingIncrementMutation({ ping })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}
