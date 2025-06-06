import algosdk from 'algosdk'
import { enqueueSnackbar } from 'notistack'

export const getAssetInfo = async (assetAId: number | bigint) => {
  try {
    console.log('Getting asset info for IDs:', assetAId.toString())

    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

    // Get asset A info
    const assetA = await algodClient.getAssetByID(assetAId).do()
    // console.log('Asset A Info:', assetA)

    return { assetInfo: assetA }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    enqueueSnackbar(`Error getting asset info: ${errMsg}`, { variant: 'error' })
    return undefined
  }
}
