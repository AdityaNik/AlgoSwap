import { useWallet } from "@txnlab/use-wallet-react"
import { TrendingUp, Settings, Database, RefreshCw, ArrowDownCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { SettingsPanel } from "./SettingPanel"
import { TokenInput } from "./TokenInput"
import { PriceInfo } from "./PriceInfo"
import { enqueueSnackbar } from "notistack"
import { getAppClient } from "./GetAppClient"
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount"
import algosdk, { makeAssetTransferTxnWithSuggestedParamsFromObject } from "algosdk"
import ConnectWallet from "./ConnectWallet"
import { useWalletUI } from "../context/WalletContext"
import axios from "axios"

export type Token = {
  symbol: string
  name: string
  balance: string
  icon: string
  id: string
  decimals: number
}

export type Pool = {
  _id: string
  name: string
  feeTier: number
  tvl: number
  liquidity: string
  reserveA: number
  reserveB: number
  assetIdA: number
  assetIdB: number
}

export const mockTokens = [
  { symbol: 'ALGO', name: 'Algorand', balance: '62', icon: '⬢', id: '0', decimals: 6 },
]

const SwapInterface = () => {
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenListFrom, setShowTokenListFrom] = useState(false)
  const [showTokenListTo, setShowTokenListTo] = useState(false)
  const [gasPrice, setGasPrice] = useState(0.004)
  const [txnSpeed, setTxnSpeed] = useState('Standard')
  const [liquiditySource, setLiquiditySource] = useState('DEX Protocol')
  const [loadingPoolInfo, setLoadingPoolInfo] = useState(false)
  const [assetAInfo, setAssetAInfo] = useState<any>(null)
  const [assetBInfo, setAssetBInfo] = useState<any>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [currentPool, setCurrentPool] = useState<Pool | null>(null)
  const {activeAddress, transactionSigner, activeWallet} = useWallet()
  const {toggleWalletModal, openWalletModal} = useWalletUI()

  // Fee constants (matching your contract)
  const FEE_NUM = 997 // 0.3% fee (1000 - 3)
  const FEE_DEN = 1000

  // Fetch pools from your API
  const fetchPools = async () => {
    console.log('Fetching pools from API...')
    try {
      const response = await axios.get('http://localhost:3000/pools') // Adjust URL as needed
      if (!response.data) {
        throw new Error('Failed to fetch pools')
      }
      const poolsData = await response.data
      setPools(poolsData)
    } catch (error) {
      console.error('Error fetching pools:', error)
      enqueueSnackbar('Failed to fetch pools', { variant: 'error' })
    }
  }

  // Find the pool for the current token pair
  const findPool = (tokenA: Token | null, tokenB: Token | null): Pool | null => {
    if (!tokenA || !tokenB || !pools.length) return null

    const assetIdA = parseInt(tokenA.id)
    const assetIdB = parseInt(tokenB.id)
    console.log('Finding pool for:', assetIdA, assetIdB)

    return pools.find(pool =>
      (pool.assetIdA === Number(assetIdA) && pool.assetIdB === Number(assetIdB)) ||
      (pool.assetIdA === Number(assetIdB) && pool.assetIdB === Number(assetIdA))
    ) || null
  }

  // Calculate swap output using constant product formula
  const calculateSwapOutput = (
    inputAmount: number,
    inputToken: Token,
    outputToken: Token,
    pool: Pool
  ): number => {
    if (!inputAmount || inputAmount <= 0) return 0

    const inputAssetId = parseInt(inputToken.id)
    const swapAmount = inputAmount

    let reserveIn: number
    let reserveOut: number

    // Determine which reserve is input and which is output
    if (pool.assetIdA === inputAssetId) {
      // Swapping A for B
      reserveIn = pool.reserveA
      reserveOut = pool.reserveB
    } else {
      // Swapping B for A
      reserveIn = pool.reserveB
      reserveOut = pool.reserveA
    }

    // Constant product formula with fee
    const k = reserveIn * reserveOut
    const newReserveIn = reserveIn + swapAmount
    const newReserveOut = (k * FEE_DEN) / (newReserveIn * FEE_NUM)
    const outputAmount = reserveOut - newReserveOut

    console.log('From:', reserveIn)
    console.log('To:', reserveOut)

    // Convert back to token units (assuming 6 decimals)
    return outputAmount
  }

  // Calculate price impact
  const calculatePriceImpact = (
    inputAmount: number,
    outputAmount: number,
    pool: Pool,
    inputToken: Token
  ): number => {
    if (!inputAmount || !outputAmount || !pool) return 0

    const inputAssetId = parseInt(inputToken.id)
    let reserveIn: number
    let reserveOut: number

    if (pool.assetIdA === inputAssetId) {
      reserveIn = pool.reserveA
      reserveOut = pool.reserveB
    } else {
      reserveIn = pool.reserveB
      reserveOut = pool.reserveA
    }

    // Current price (reserve ratio)
    const currentPrice = reserveOut / reserveIn

    // Execution price
    const executionPrice = outputAmount / inputAmount

    // Price impact = (executionPrice - currentPrice) / currentPrice * 100
    const priceImpact = Math.abs((executionPrice - currentPrice) / currentPrice) * 100

    return priceImpact
  }

  // Load pools on component mount
  useEffect(() => {
    fetchPools()
  }, [])

  // Update current pool when tokens change
  useEffect(() => {
    const pool = findPool(fromToken, toToken)
    setCurrentPool(pool)
  }, [fromToken, toToken, pools])

  // Calculate to amount based on from amount using local calculation
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken && currentPool) {
      console.log('Calculating swap output...')
      try {
        const calculated = calculateSwapOutput(
          parseFloat(fromAmount),
          fromToken,
          toToken,
          currentPool
        )
        setToAmount(calculated > 0 ? calculated.toString() : '0')
      } catch (error) {
        console.error('Error calculating swap:', error)
        setToAmount('0')
      }
    } else {
      setToAmount('')
    }
  }, [fromAmount, toAmount, fromToken, toToken, currentPool])

  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  const handleSwap = async () => {
  try {
    if (!activeAddress) {
      enqueueSnackbar('Active address is required', { variant: 'error' })
      return
    }

    if (!currentPool) {
      enqueueSnackbar('No pool found for this token pair', { variant: 'error' })
      return
    }

    const appClient = await getAppClient(activeAddress, transactionSigner)
    if (!appClient) {
      return
    }

    const atc = new algosdk.AtomicTransactionComposer()
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
    const suggestedParams = await algodClient.getTransactionParams().do()
    suggestedParams.fee = BigInt(1000)

    // Helper function to create pool key (matches contract logic)
    const createPoolKey = (assetIdA: bigint, assetIdB: bigint): Uint8Array => {
      const idA = assetIdA
      const idB = assetIdB

      // Ensure consistent ordering (smaller asset ID first)
      if (idA < idB) {
        const bytesA = new Uint8Array(8)
        const bytesB = new Uint8Array(8)
        new DataView(bytesA.buffer).setBigUint64(0, idA, false) // big-endian
        new DataView(bytesB.buffer).setBigUint64(0, idB, false) // big-endian
        return new Uint8Array([...bytesA, ...bytesB])
      } else {
        const bytesA = new Uint8Array(8)
        const bytesB = new Uint8Array(8)
        new DataView(bytesA.buffer).setBigUint64(0, idA, false) // big-endian
        new DataView(bytesB.buffer).setBigUint64(0, idB, false) // big-endian
        return new Uint8Array([...bytesB, ...bytesA])
      }
    }

    const poolKey = createPoolKey(BigInt(fromToken?.id ?? 0), BigInt(toToken?.id ?? 0))

    // Create all the box names that the swap function needs
    const poolAssetABox = new Uint8Array([...new TextEncoder().encode('pa_'), ...poolKey])
    const poolAssetBBox = new Uint8Array([...new TextEncoder().encode('pb_'), ...poolKey])
    const poolReserveABox = new Uint8Array([...new TextEncoder().encode('ra_'), ...poolKey])
    const poolReserveBBox = new Uint8Array([...new TextEncoder().encode('rb_'), ...poolKey])
    const poolTotalLpBox = new Uint8Array([...new TextEncoder().encode('lp_'), ...poolKey])

    // Add the swap method call with all required boxes
    atc.addMethodCall({
      appID: appClient.appId,
      method: appClient.appClient.getABIMethod('swap'),
      methodArgs: [
        BigInt(fromToken?.id ?? 0),
        BigInt(toToken?.id ?? 0),
        BigInt(fromToken?.id ?? 0), // sendAssetId
        BigInt(fromAmount)
      ],
      sender: activeAddress,
      suggestedParams,
      signer: transactionSigner,
      boxes: [
        { appIndex: 0, name: poolAssetABox },
        { appIndex: 0, name: poolAssetBBox },
        { appIndex: 0, name: poolReserveABox },
        { appIndex: 0, name: poolReserveBBox },
        { appIndex: 0, name: poolTotalLpBox },
      ],
    })

    console.log('Adding asset transfer transaction for fromToken:', fromAmount)
    console.log('From Token: ', fromToken)
    console.log('To Token: ', toToken)

    // Add the asset transfer transaction
    const assetATxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      assetIndex: BigInt(fromToken?.id || 0),
      sender: activeAddress,
      receiver: appClient.appAddress,
      amount: BigInt(Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken?.decimals || 6))),
      suggestedParams,
    })

    atc.addTransaction({ txn: assetATxn, signer: transactionSigner })

    const result = await atc.execute(algodClient, 4)

   const res = await axios.post('http://localhost:3000/updatePool', {
     id: currentPool?._id,
     tvl: currentPool?.tvl,
     liquidity: currentPool?.liquidity,
     reserveA: currentPool?.reserveA + parseFloat(fromAmount),
     reserveB: currentPool?.reserveB - parseFloat(toAmount),
   })

    enqueueSnackbar(`Swapped successfully! Transaction ID: ${result.txIDs}`, { variant: 'success' })

    // Refresh pools after successful swap
    await fetchPools()
  } catch (error) {
    console.error('Error performing swap:', error)
    enqueueSnackbar(`Error performing swap: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error' })
  } finally {
    setFromAmount('')
    setToAmount('')
  }
}

  const getPoolInfo = async () => {
    try {
      if (!activeAddress || !transactionSigner) {
        enqueueSnackbar('Active address and transaction signer are required', { variant: 'error' })
        return undefined
      }
      setLoadingPoolInfo(true)

      const appClient = await getAppClient(activeAddress, transactionSigner)
      if (!appClient) {
        setLoadingPoolInfo(false)
        return undefined
      }

      if (!fromToken || !toToken) {
        enqueueSnackbar('Both tokens must be selected', { variant: 'error' })
        setLoadingPoolInfo(false)
        return undefined
      }

      const res = await appClient.send.poolExists({
        extraFee: AlgoAmount.Algos(0.1),
        args: [BigInt(fromToken.id), BigInt(toToken.id)],
        signer: transactionSigner,
        sender: activeAddress,
      })

      if(res.return === false) {
        enqueueSnackbar('Pool does not exist for the selected tokens', { variant: 'error' })
        setLoadingPoolInfo(false)
        return undefined
      }

      // Refresh pool data from API
      await fetchPools()
      enqueueSnackbar('Pool info updated successfully', { variant: 'success' })

      setLoadingPoolInfo(false)
      return res.return
    } catch (error) {
      enqueueSnackbar(`Error getting pool info: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error' })
      setLoadingPoolInfo(false)
      return undefined
    }
  }

  // Calculate price impact for display
  const priceImpact = fromAmount && toAmount && currentPool && fromToken
    ? calculatePriceImpact(parseFloat(fromAmount), parseFloat(toAmount), currentPool, fromToken)
    : 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Swap
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showSettings ? 'bg-purple-500/30 border border-purple-400/50' : 'bg-white/10 hover:bg-white/20 border border-white/20'
              }`}
            >
              <Settings size={18} className="text-white" />
            </button>
            <button
              onClick={getPoolInfo}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
              disabled={loadingPoolInfo}
            >
              <Database size={18} className={`${loadingPoolInfo ? 'animate-spin text-purple-400' : 'text-white'}`} />
            </button>
            <button
              onClick={fetchPools}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
            >
              <RefreshCw size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Pool Status Indicator */}
        {fromToken && toToken && (
          <div className={`text-center text-sm py-2 px-4 rounded-lg ${
            currentPool
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {currentPool
              ? `Pool found: ${currentPool.name} (TVL: $${currentPool.tvl?.toLocaleString() || 'N/A'})`
              : 'No pool available for this pair'
            }
          </div>
        )}

        {/* Settings Panel */}
        <SettingsPanel
          showSettings={showSettings}
          slippage={slippage}
          setSlippage={setSlippage}
          txnSpeed={txnSpeed}
          setTxnSpeed={setTxnSpeed}
          gasPrice={gasPrice}
          setGasPrice={setGasPrice}
        />

        {/* From Token Input */}
        <TokenInput
          label="From"
          token={fromToken}
          amount={fromAmount}
          onAmountChange={setFromAmount}
          onTokenChange={setFromToken}
          showTokenList={showTokenListFrom}
          setShowTokenList={setShowTokenListFrom}
          showMaxHalf={true}
          tokens={mockTokens}
          position="top"
        />

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative">
          <button
            onClick={handleSwapTokens}
            className="bg-white/10 hover:bg-white/20 p-3 rounded-full shadow-lg border border-white/20 transform transition-all duration-300 hover:rotate-180 hover:scale-110 backdrop-blur-sm"
          >
            <ArrowDownCircle size={28} className="text-purple-400" />
          </button>
        </div>

        {/* To Token Input */}
        <TokenInput
          label="To (estimated)"
          token={toToken}
          amount={toAmount}
          onAmountChange={setToAmount}
          onTokenChange={setToToken}
          showTokenList={showTokenListTo}
          setShowTokenList={setShowTokenListTo}
          readonly={true}
          tokens={mockTokens}
          position="top"
        />

        {/* Price Impact Warning */}
        {priceImpact > 0 && (
          <div className={`text-center text-sm py-2 px-4 rounded-lg ${
            priceImpact > 5
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : priceImpact > 2
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            Price Impact: {priceImpact.toFixed(2)}%
            {priceImpact > 5 && ' ⚠️ High price impact!'}
          </div>
        )}

        {/* Price Information */}
        <PriceInfo
          fromToken={fromToken}
          toToken={toToken}
          fromAmount={fromAmount}
          liquiditySource={liquiditySource}
          assetAInfo={assetAInfo}
          assetBInfo={assetBInfo}
        />

        {/* Main Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || !currentPool}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg ${
            !fromAmount || parseFloat(fromAmount) <= 0 || !currentPool
              ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95'
          }`}
        >
          {!fromAmount || parseFloat(fromAmount) <= 0
            ? 'Enter an amount'
            : !activeAddress
            ? 'Connect Wallet'
            : !currentPool
            ? 'Pool not available'
            : 'Swap Tokens'
          }
        </button>
      </div>

      {/* Info footer */}
      <div className="mt-8 text-center text-white/60 text-sm font-medium">
        🚀 Powered by decentralized liquidity protocols
      </div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default SwapInterface
