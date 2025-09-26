import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { PingUiButtonInitialize } from './ui/ping-ui-button-initialize'
import { PingUiList } from './ui/ping-ui-list'
import { PingUiProgramExplorerLink } from './ui/ping-ui-program-explorer-link'
import { PingUiProgramGuard } from './ui/ping-ui-program-guard'

export default function PingFeature() {
  const { account } = useSolana()

  return (
    <PingUiProgramGuard>
      <AppHero
        title="Ping"
        subtitle={
          account
            ? "Initialize a new ping onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <PingUiProgramExplorerLink />
        </p>
        {account ? (
          <PingUiButtonInitialize />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletDropdown />
          </div>
        )}
      </AppHero>
      {account ? <PingUiList /> : null}
    </PingUiProgramGuard>
  )
}
