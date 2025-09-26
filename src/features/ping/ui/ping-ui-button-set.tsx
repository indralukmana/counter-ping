import { PingAccount } from '@project/anchor'
import { Button } from '@/components/ui/button'

import { usePingSetMutation } from '@/features/ping/data-access/use-ping-set-mutation'

export function PingUiButtonSet({ ping }: { ping: PingAccount }) {
  const setMutation = usePingSetMutation({ ping })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', ping.data.count.toString() ?? '0')
        if (!value || parseInt(value) === ping.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}
