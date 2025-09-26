import { PING_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function PingUiProgramExplorerLink() {
  return <AppExplorerLink address={PING_PROGRAM_ADDRESS} label={ellipsify(PING_PROGRAM_ADDRESS)} />
}
