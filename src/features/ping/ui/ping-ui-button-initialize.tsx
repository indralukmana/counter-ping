import { Button } from '@/components/ui/button'

import { usePingInitializeMutation } from '@/features/ping/data-access/use-ping-initialize-mutation'

export function PingUiButtonInitialize() {
  const mutationInitialize = usePingInitializeMutation()

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Ping {mutationInitialize.isPending && '...'}
    </Button>
  )
}
