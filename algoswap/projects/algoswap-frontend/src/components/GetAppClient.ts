import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { AmmContractClient } from '../contracts/AMMContract'
import { enqueueSnackbar } from 'notistack'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { TransactionSigner } from 'algosdk'

const algodConfig = getAlgodConfigFromViteEnvironment()
const indexerConfig = getIndexerConfigFromViteEnvironment()
const algorand = AlgorandClient.fromConfig({
  algodConfig,
  indexerConfig,
})

export const getAppClient = async (activeAddress: string, transactionSigner: TransactionSigner | TransactionSignerAccount) => {
  // Use the existing contract ID instead of deploying a new one
  const appId = BigInt(738945422)
  algorand.setDefaultSigner(transactionSigner)

  try {
    if (!activeAddress) {
      enqueueSnackbar('Active address is required', { variant: 'error' })
      return
    }

    if (!algorand) {
      enqueueSnackbar('Algorand client not initialized', { variant: 'error' })
      return
    }

    const appClient = new AmmContractClient({
      appId: appId,
      algorand,
      appName: 'AMM Pool',
      defaultSigner: transactionSigner as TransactionSigner,
      defaultSender: activeAddress as string,
      approvalSourceMap: undefined,
      clearSourceMap: undefined,
    })

    return appClient
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    enqueueSnackbar(`Error creating pool: ${errorMessage}`, { variant: 'error' })
  }
  return null
}
