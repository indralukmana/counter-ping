import { PingAccount } from '@project/anchor'
import { Button } from '@/components/ui/button'

import { usePingCloseMutation } from '@/features/ping/data-access/use-ping-close-mutation'

export function PingUiButtonClose({ ping }: { ping: PingAccount }) {
  const closeMutation = usePingCloseMutation({ ping })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
