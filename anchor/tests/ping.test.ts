import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchPing,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('ping', () => {
  let payer: KeyPairSigner
  let ping: KeyPairSigner

  beforeAll(async () => {
    ping = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Ping', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, ping: ping })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentPing = await fetchPing(rpc, ping.address)
    expect(currentPing.data.count).toEqual(0)
  })

  it('Increment Ping', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({
      ping: ping.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchPing(rpc, ping.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Increment Ping Again', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({ ping: ping.address })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchPing(rpc, ping.address)
    expect(currentCount.data.count).toEqual(2)
  })

  it('Decrement Ping', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getDecrementInstruction({
      ping: ping.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchPing(rpc, ping.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Set ping value', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getSetInstruction({ ping: ping.address, value: 42 })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchPing(rpc, ping.address)
    expect(currentCount.data.count).toEqual(42)
  })

  it('Set close the ping account', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getCloseInstruction({
      payer: payer,
      ping: ping.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    try {
      await fetchPing(rpc, ping.address)
    } catch (e) {
      if (!isSolanaError(e)) {
        throw new Error(`Unexpected error: ${e}`)
      }
      expect(e.message).toEqual(`Account not found at address: ${ping.address}`)
    }
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
