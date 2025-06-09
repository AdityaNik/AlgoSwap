import { useState } from 'react'
import { ChevronLeft, Settings, ArrowDown, X, Search, Loader2, AlertCircle } from 'lucide-react'
import { StepIndicator } from './StepIndicator'
import { TokenPairSelection } from './TokenPairSelection'
import { PositionParameters } from './PositionParameter'
import { TokenSearchModal } from './TokenSearch'
import axios from 'axios'
import ConnectWallet from './ConnectWallet'
import { useWalletUI } from '../context/WalletContext'
import { getAssetInfo } from '../utils/getAssetInfo'
import { algo } from '@algorandfoundation/algokit-utils'

// Types
export interface Token {
  id: string
  symbol: string
  name: string
  icon: string
  verified?: boolean
}

interface NewPositionInterfaceProps {
  onBack: () => void
  activeAddress?: string
  transactionSigner?: any
  getAppClient?: (address: string, signer: any) => Promise<any>
  enqueueSnackbar?: (message: string, options: { variant: 'success' | 'error' | 'info' }) => void
}

const NewPositionInterface = ({ onBack, activeAddress, transactionSigner, getAppClient, enqueueSnackbar }: NewPositionInterfaceProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedToken1, setSelectedToken1] = useState<Token | null>(null)
  const [selectedToken2, setSelectedToken2] = useState<Token | null>(null)
  const [selectingToken, setSelectingToken] = useState<1 | 2 | null>(null)
  const [feeTier, setFeeTier] = useState('0.30%')
  const [depositAmounts, setDepositAmounts] = useState({ token1: '', token2: '' })
  const [loading, setLoading] = useState(false)
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [checkingPool, setCheckingPool] = useState(false)
  const { openWalletModal, toggleWalletModal } = useWalletUI()

  const handleSelectToken = (token: Token) => {
    if (selectingToken === 1) {
      setSelectedToken1(token)
    } else if (selectingToken === 2) {
      setSelectedToken2(token)
    }
    setSelectingToken(null)
    setPoolExists(null) // Reset pool check when tokens change
  }

  const swapTokens = () => {
    const temp = selectedToken1
    setSelectedToken1(selectedToken2)
    setSelectedToken2(temp)
    setPoolExists(null) // Reset pool check when tokens are swapped
  }

  // Check if pool exists for the selected token pair
  const checkPoolExists = async (): Promise<boolean | undefined> => {
    if (!selectedToken1 || !selectedToken2) {
      return undefined
    }

    setCheckingPool(true)
    try {
      // Call backend API to get all pools
      const response = await axios.get('http://localhost:3000/pools')
      const pools = response.data

      console.log('Retrieved pools:', pools)

      // Create the expected pool name based on selected tokens
      const expectedPoolName1 = `${selectedToken1.symbol}/${selectedToken2.symbol}`
      const expectedPoolName2 = `${selectedToken2.symbol}/${selectedToken1.symbol}`

      console.log('Looking for pool names:', { expectedPoolName1, expectedPoolName2 })

      // Check if a pool with matching name exists
      const poolExists = pools.some((pool: any) => pool.name === expectedPoolName1 || pool.name === expectedPoolName2)

      console.log('Pool exists:', poolExists)

      setPoolExists(poolExists)
      return poolExists
    } catch (error) {
      console.log('Error checking pool existence:', error)
      setPoolExists(false)
      return false
    } finally {
      setCheckingPool(false)
    }
  }

  const sendCreatePoolCall = async () => {
    if (!activeAddress || !getAppClient || !selectedToken1 || !selectedToken2) {
      enqueueSnackbar?.('Missing required parameters for pool creation', { variant: 'error' })
      return false
    }

    setLoading(true)
    try {
      const appClient = await getAppClient(activeAddress, transactionSigner)
      if (!appClient) {
        setLoading(false)
        return false
      }

      // Get fresh suggested parameters right before transaction
      const algosdk = (window as any).algosdk || (await import('algosdk'))
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
      const suggestedParams = await algodClient.getTransactionParams().do()
      console.log('Fresh suggested params:', suggestedParams)

      // Optional: Reduce the validity window to avoid timing issues
      suggestedParams.lastRound = suggestedParams.firstRound + 10

      const assetIdA = BigInt(selectedToken1.id)
      const assetIdB = BigInt(selectedToken2.id)
      console.log('Selected tokens:', selectedToken1, selectedToken2)
      console.log('Asset IDs - A:', assetIdA, 'B:', assetIdB)
      console.log('Fresh suggested params:', suggestedParams)

      const algoAmount = algo(0.01) // Minimum balance requirement for the pool
      console.log('Minimum Algo amount required:', algoAmount)

      const response = await appClient.send.createPool({
        args: [assetIdA, assetIdB],
        signer: transactionSigner,
        extraFee: algoAmount,
        sender: activeAddress,
      })

      if (response) {
        enqueueSnackbar?.(`Pool created successfully!`, { variant: 'success' })
        setPoolExists(true)
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating pool:', error)
      enqueueSnackbar?.(`Error creating pool: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error' })
      return false
    } finally {
      setLoading(false)
    }
  }

  const addLiquidity = async () => {
    if (!activeAddress || !getAppClient || !selectedToken1 || !selectedToken2) {
      enqueueSnackbar?.('Missing required parameters for adding liquidity', { variant: 'error' })
      return false
    }

    if (!depositAmounts.token1 || !depositAmounts.token2) {
      enqueueSnackbar?.('Please enter amounts for both tokens', { variant: 'error' })
      return false
    }

    setLoading(true)
    try {
      const appClient = await getAppClient(activeAddress, transactionSigner)
      if (!appClient) {
        setLoading(false)
        return false
      }

      // Import algosdk dynamically or ensure it's available
      const algosdk = (window as any).algosdk || (await import('algosdk'))

      const atc = new algosdk.AtomicTransactionComposer()
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

      // Get FRESH suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do()
      suggestedParams.fee = BigInt(1000)
      // Reduce validity window to avoid timing issues
      suggestedParams.lastRound = suggestedParams.firstRound + 10

      // Helper function to create pool key (matching contract logic)
      const createPoolKey = (assetIdA: string | number | bigint | boolean, assetIdB: string | number | bigint | boolean) => {
        let idA = BigInt(assetIdA)
        let idB = BigInt(assetIdB)

        // Ensure consistent ordering (smaller asset ID first)
        if (idA < idB) {
          // Convert to 8-byte big-endian format
          const bytesA = new Uint8Array(8)
          const bytesB = new Uint8Array(8)

          // Write as big-endian
          for (let i = 7; i >= 0; i--) {
            bytesA[i] = Number(idA & 0xffn)
            bytesB[i] = Number(idB & 0xffn)
            idA >>= 8n
            idB >>= 8n
          }

          const combined = new Uint8Array(16)
          combined.set(bytesA, 0)
          combined.set(bytesB, 8)
          return combined
        } else {
          // Reverse order
          const bytesA = new Uint8Array(8)
          const bytesB = new Uint8Array(8)

          let tempA = idA
          let tempB = idB

          for (let i = 7; i >= 0; i--) {
            bytesA[i] = Number(tempA & 0xffn)
            bytesB[i] = Number(tempB & 0xffn)
            tempA >>= 8n
            tempB >>= 8n
          }

          const combined = new Uint8Array(16)
          combined.set(bytesB, 0)
          combined.set(bytesA, 8)
          return combined
        }
      }

      // Create the pool key
      const poolKey = createPoolKey(selectedToken1.id, selectedToken2.id)

      // Create LP balance key: 'bal_' + poolKey + account
      const balPrefix = new TextEncoder().encode('bal_')
      const accountBytes = algosdk.decodeAddress(activeAddress).publicKey

      const lpBalanceKey = new Uint8Array(balPrefix.length + poolKey.length + accountBytes.length)
      lpBalanceKey.set(balPrefix, 0)
      lpBalanceKey.set(poolKey, balPrefix.length)
      lpBalanceKey.set(accountBytes, balPrefix.length + poolKey.length)

      // Create pool-related box keys
      const paPrefix = new TextEncoder().encode('pa_')
      const pbPrefix = new TextEncoder().encode('pb_')
      const raPrefix = new TextEncoder().encode('ra_')
      const rbPrefix = new TextEncoder().encode('rb_')
      const lpPrefix = new TextEncoder().encode('lp_')

      const poolAssetAKey = new Uint8Array(paPrefix.length + poolKey.length)
      poolAssetAKey.set(paPrefix, 0)
      poolAssetAKey.set(poolKey, paPrefix.length)

      const poolAssetBKey = new Uint8Array(pbPrefix.length + poolKey.length)
      poolAssetBKey.set(pbPrefix, 0)
      poolAssetBKey.set(poolKey, pbPrefix.length)

      const poolReserveAKey = new Uint8Array(raPrefix.length + poolKey.length)
      poolReserveAKey.set(raPrefix, 0)
      poolReserveAKey.set(poolKey, raPrefix.length)

      const poolReserveBKey = new Uint8Array(rbPrefix.length + poolKey.length)
      poolReserveBKey.set(rbPrefix, 0)
      poolReserveBKey.set(poolKey, rbPrefix.length)

      const poolTotalLpKey = new Uint8Array(lpPrefix.length + poolKey.length)
      poolTotalLpKey.set(lpPrefix, 0)
      poolTotalLpKey.set(poolKey, lpPrefix.length)

      console.log(
        'Pool key:',
        Array.from(poolKey)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      )
      console.log(
        'LP balance key:',
        Array.from(lpBalanceKey)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      )

      const algoAmount = algo(0.1) // Minimum balance requirement for the pool
      console.log('Minimum Algo amount required:', algoAmount)

      // Add the addLiquidity method call
      atc.addMethodCall({
        appID: appClient.appId,
        method: appClient.appClient.getABIMethod('addLiquidity'),
        methodArgs: [BigInt(selectedToken1.id), BigInt(selectedToken2.id), BigInt(depositAmounts.token1), BigInt(depositAmounts.token2)],
        sender: activeAddress,
        suggestedParams,
        signer: transactionSigner,
        extraFee: algoAmount,
        boxes: [
          // All box references the contract might access
          { appIndex: 0, name: poolAssetAKey },
          { appIndex: 0, name: poolAssetBKey },
          { appIndex: 0, name: poolReserveAKey },
          { appIndex: 0, name: poolReserveBKey },
          { appIndex: 0, name: poolTotalLpKey },
          { appIndex: 0, name: lpBalanceKey },
        ],
      })

      const assetIdA = selectedToken1.id || BigInt(738849537)
      const assetIdB = selectedToken2.id || BigInt(738849606)

      // Convert amounts (assuming token amounts need to be scaled)
      let amountA = BigInt(depositAmounts.token1) * BigInt(10)
      let amountB = BigInt(depositAmounts.token2) * BigInt(10)

      // Create asset transfer transactions with FRESH suggested params
      const assetATxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: amountA,
        assetIndex: BigInt(assetIdA),
        suggestedParams,
      })

      const assetBTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: amountB,
        assetIndex: BigInt(assetIdB),
        suggestedParams,
      })

      // Add transactions to composer
      atc.addTransaction({ txn: assetATxn, signer: transactionSigner })
      atc.addTransaction({ txn: assetBTxn, signer: transactionSigner })

      // Execute the transaction group
      const result = await atc.execute(algodClient, 4)

      enqueueSnackbar?.(`Liquidity added successfully! Transaction ID: ${result.txId}`, { variant: 'success' })
      return true
    } catch (error) {
      console.error('Error adding liquidity:', error)
      enqueueSnackbar?.(`Error adding liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error' })
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1 && selectedToken1 && selectedToken2) {
      // Check if pool exists before proceeding
      await checkPoolExists()
      console.log('Pool exists:', poolExists)
      setCurrentStep(2)
    }
  }

  const handleCreate = async () => {
    console.log(poolExists, 'Pool exists state before creation')

    if (poolExists === false || poolExists === null) {
      console.log('Creating pool since it does not exist...')
      const poolCreated = await sendCreatePoolCall()
      if (!poolCreated) {
        return
      }
      // Small delay to ensure pool creation is confirmed
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    console.log('Pool exists:', poolExists)

    // Add liquidity immediately after pool creation
    const liquidityAdded = await addLiquidity()
    if (liquidityAdded) {
      // Reset form or navigate back

      const tokaPrice = 1
      const tokbPrice = 1

      // Calculate TVL/Liquidity
      const tokaValue = Number(depositAmounts.token1) * tokaPrice
      const tokbValue = Number(depositAmounts.token2) * tokbPrice
      const totalLiquidity = tokaValue + tokbValue

      const res = await axios.post('http://localhost:3000/createPool', {
        name: `${selectedToken1?.symbol}/${selectedToken2?.symbol}`,
        tvl: totalLiquidity,
        liquidity: totalLiquidity,
      })

      setCurrentStep(1)
      setSelectedToken1(null)
      setSelectedToken2(null)
      setDepositAmounts({ token1: '', token2: '' })
      console.log('Pool created:', res.data)
      enqueueSnackbar?.(`Pool created successfully!`, { variant: 'success' })
    } else {
      enqueueSnackbar?.('Failed to add liquidity', { variant: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <button className="flex items-center text-gray-400 hover:text-white transition-colors group" onClick={onBack} disabled={loading}>
            <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Pools
          </button>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Create a Position
          </h1>

          <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/30 rounded-lg" disabled={loading}>
            <Settings size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 ? (
            <>
              <TokenPairSelection
                selectedToken1={selectedToken1}
                selectedToken2={selectedToken2}
                onSelectToken1={() => setSelectingToken(1)}
                onSelectToken2={() => setSelectingToken(2)}
                onSwapTokens={swapTokens}
              />

              <div className="mt-8 flex justify-end">
                <button
                  className={`px-8 py-4 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    selectedToken1 && selectedToken2 && !loading
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                      : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleNext}
                  disabled={!selectedToken1 || !selectedToken2 || loading}
                >
                  {checkingPool && <Loader2 size={16} className="animate-spin" />}
                  Next Step
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Pool Status Indicator */}
              {poolExists !== null && (
                <div
                  className={`mb-6 p-4 rounded-lg border ${
                    poolExists
                      ? 'bg-green-900/20 border-green-500/30 text-green-300'
                      : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span className="font-medium">
                      {poolExists
                        ? 'Pool exists - You can add liquidity directly'
                        : 'Pool does not exist - It will be created automatically'}
                    </span>
                  </div>
                </div>
              )}

              <PositionParameters
                selectedToken1={selectedToken1}
                selectedToken2={selectedToken2}
                feeTier={feeTier}
                setFeeTier={setFeeTier}
                depositAmounts={depositAmounts}
                setDepositAmounts={setDepositAmounts}
              />

              <div className="mt-8 flex justify-between">
                <button
                  className="px-8 py-4 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-gray-600/50 transition-colors"
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                >
                  Back
                </button>

                <button
                  onClick={handleCreate}
                  disabled={loading || !depositAmounts.token1 || !depositAmounts.token2}
                  className={`px-8 py-4 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    loading || !depositAmounts.token1 || !depositAmounts.token2
                      ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                  }`}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {activeAddress ? (poolExists === false ? 'Create Pool & Add Liquidity' : 'Add Liquidity') : 'Connect Wallet'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Token Search Modal */}
        <TokenSearchModal
          isOpen={selectingToken !== null}
          onClose={() => setSelectingToken(null)}
          onSelectToken={handleSelectToken}
          title={`Select ${selectingToken === 1 ? 'First' : 'Second'} Token`}
        />
      </div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default NewPositionInterface
