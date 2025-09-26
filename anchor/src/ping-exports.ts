// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Ping, PING_DISCRIMINATOR, PING_PROGRAM_ADDRESS, getPingDecoder } from './client/js'
import PingIDL from '../target/idl/ping.json'

export type PingAccount = Account<Ping, string>

// Re-export the generated IDL and type
export { PingIDL }

export * from './client/js'

export function getPingProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getPingDecoder(),
    filter: getBase58Decoder().decode(PING_DISCRIMINATOR),
    programAddress: PING_PROGRAM_ADDRESS,
  })
}
