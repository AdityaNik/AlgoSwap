import { useState } from 'react'
import { ChevronLeft, Settings, ArrowDown, X, Search, Loader2, AlertCircle } from 'lucide-react'
import { StepIndicator } from './StepIndicator'
import { TokenPairSelection } from './TokenPairSelection'
import { PositionParameters } from './PositionParameter'
import { TokenSearchModal } from './TokenSearch'

// Types
export interface Token {
  id: string
  symbol: string
  name: string
  icon: string
  verified?: boolean
  assetId?: bigint // Add asset ID for Algorand integration
}

interface NewPositionInterfaceProps {
  onBack: () => void
  activeAddress?: string
  transactionSigner?: any
  getAppClient?: (address: string, signer: any) => Promise<any>
  enqueueSnackbar?: (message: string, options: { variant: 'success' | 'error' | 'info' }) => void
}

const NewPositionInterface = ({
  onBack,
  activeAddress,
  transactionSigner,
  getAppClient,
  enqueueSnackbar
}: NewPositionInterfaceProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedToken1, setSelectedToken1] = useState<Token | null>(null)
  const [selectedToken2, setSelectedToken2] = useState<Token | null>(null)
  const [selectingToken, setSelectingToken] = useState<1 | 2 | null>(null)
  const [feeTier, setFeeTier] = useState('0.30%')
  const [depositAmounts, setDepositAmounts] = useState({ token1: '', token2: '' })
  const [loading, setLoading] = useState(false)
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [checkingPool, setCheckingPool] = useState(false)

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
  const checkPoolExists = async () => {
    if (!selectedToken1 || !selectedToken2 || !activeAddress || !getAppClient) {
      return
    }

    setCheckingPool(true)
    try {
      const appClient = await getAppClient(activeAddress, transactionSigner)
      if (!appClient) {
        setCheckingPool(false)
        return
      }

      // Try to get pool info to check if pool exists
      const poolInfo = await appClient.send.getPoolInfo({
        signer: transactionSigner,
      })

      if (poolInfo && poolInfo.return) {
        const [assetIdA, assetIdB] = poolInfo.return
        // Check if the assets match our selected tokens
        if ((assetIdA === selectedToken1.assetId && assetIdB === selectedToken2.assetId) ||
            (assetIdA === selectedToken2.assetId && assetIdB === selectedToken1.assetId)) {
          setPoolExists(true)
        } else {
          setPoolExists(false)
        }
      } else {
        setPoolExists(false)
      }
    } catch (error) {
      console.log('Pool does not exist or error checking:', error)
      setPoolExists(false)
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

      // Use the asset IDs from selected tokens
      const assetIdA = selectedToken1.assetId || BigInt(738849537) // fallback
      const assetIdB = selectedToken2.assetId || BigInt(738849606) // fallback

      const response = await appClient.send.createPool({
        args: { assetIdA, assetIdB },
        extraFee: { microAlgos: 100000 }, // 0.1 ALGO
        signer: transactionSigner,
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
      const algosdk = (window as any).algosdk || await import('algosdk')

      const atc = new algosdk.AtomicTransactionComposer()
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
      const suggestedParams = await algodClient.getTransactionParams().do()
      suggestedParams.fee = BigInt(1000)

      // Create box name for LP balance
      const boxName = new Uint8Array([
        ...new TextEncoder().encode('lp_'),
        ...algosdk.decodeAddress(activeAddress).publicKey
      ])

      // Add the addLiquidity method call
      atc.addMethodCall({
        appID: appClient.appId,
        method: appClient.appClient.getABIMethod('addLiquidity'),
        methodArgs: [BigInt(depositAmounts.token1), BigInt(depositAmounts.token2)],
        sender: activeAddress,
        suggestedParams,
        signer: transactionSigner,
        boxes: [{
          appIndex: 0,
          name: boxName,
        }],
      })

      const assetIdA = selectedToken1.assetId || BigInt(738849537)
      const assetIdB = selectedToken2.assetId || BigInt(738849606)

      // Convert amounts (assuming token amounts need to be scaled)
      let amountA = BigInt(depositAmounts.token1) * BigInt(10)
      let amountB = BigInt(depositAmounts.token2) * BigInt(10)

      // Create asset transfer transactions
      const assetATxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: amountA,
        assetIndex: Number(assetIdA),
        suggestedParams,
      })

      const assetBTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: amountB,
        assetIndex: Number(assetIdB),
        suggestedParams,
      })

      // Add transactions to composer
      atc.addTransaction({ txn: assetATxn, signer: transactionSigner })
      atc.addTransaction({ txn: assetBTxn, signer: transactionSigner })

      // Execute the transaction group
      const result = await atc.execute(algodClient, 4)

      enqueueSnackbar?.(`Liquidity added successfully! Group ID: ${result.txIDs.join(', ')}`, { variant: 'success' })
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
    if (poolExists === false) {
      // Need to create pool first
      const poolCreated = await sendCreatePoolCall()
      if (!poolCreated) {
        return
      }
    }

    // Add liquidity
    const liquidityAdded = await addLiquidity()
    if (liquidityAdded) {
      // Reset form or navigate back
      setCurrentStep(1)
      setSelectedToken1(null)
      setSelectedToken2(null)
      setDepositAmounts({ token1: '', token2: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <button
            className="flex items-center text-gray-400 hover:text-white transition-colors group"
            onClick={onBack}
            disabled={loading}
          >
            <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Pools
          </button>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Create a Position
          </h1>

          <button
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/30 rounded-lg"
            disabled={loading}
          >
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
                <div className={`mb-6 p-4 rounded-lg border ${
                  poolExists
                    ? 'bg-green-900/20 border-green-500/30 text-green-300'
                    : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span className="font-medium">
                      {poolExists
                        ? 'Pool exists - You can add liquidity directly'
                        : 'Pool does not exist - It will be created automatically'
                      }
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
                  {poolExists === false ? 'Create Pool & Add Liquidity' : 'Add Liquidity'}
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
    </div>
  )
}

export default NewPositionInterface
