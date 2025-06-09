import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { MultiPoolAmmContractClient } from '../contracts/MultiPoolAMMContract'
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
  const appId = BigInt(740788187)
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

    const appClient = new MultiPoolAmmContractClient({
      appId: appId,
      algorand,
      appName: 'Multi Pool AMM',
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
