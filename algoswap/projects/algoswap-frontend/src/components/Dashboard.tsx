import React, { useState, useEffect } from 'react'
import { ArrowDownCircle, Settings, Info, RefreshCw, Database } from 'lucide-react'
import ConnectWallet from './ConnectWallet'
import { getAppClient } from './GetAppClient'
import { useWallet } from '@txnlab/use-wallet-react'
import { enqueueSnackbar } from 'notistack'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import algosdk, { makeAssetTransferTxnWithSuggestedParamsFromObject } from 'algosdk'

// Token data with icons
const tokens = [
  { symbol: 'TOKA', name: 'Token A', balance: '1', icon: '⟠' },
  { symbol: 'TOKB', name: 'Token B', balance: '2,450.00', icon: '◈' },
]

interface ConnectWalletInterface {
  openWalletModal: boolean
  toggleWalletModal: () => void
}

const SwapInterface = ({ openWalletModal, toggleWalletModal }: ConnectWalletInterface) => {
  const [fromToken, setFromToken] = useState('TOKA')
  const [toToken, setToToken] = useState('TOKB')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenListFrom, setShowTokenListFrom] = useState(false)
  const [showTokenListTo, setShowTokenListTo] = useState(false)
  const [gasPrice, setGasPrice] = useState('12')
  const [txnSpeed, setTxnSpeed] = useState('Standard')
  const [liquiditySource, setLiquiditySource] = useState('Uniswap V3')
  const [loadingPoolInfo, setLoadingPoolInfo] = useState(false)
  const [assetAInfo, setAssetAInfo] = useState<{ name: string; unitName: string; decimals: number; reserveA: bigint }>({
    name: '',
    unitName: '',
    decimals: 0,
    reserveA: 0n,
  })
  const [assetBInfo, setAssetBInfo] = useState<{ name: string; unitName: string; decimals: number; reserveB: bigint }>({
    name: '',
    unitName: '',
    decimals: 0,
    reserveB: 0n,
  })

  const { activeAddress, transactionSigner, activeWallet, algodClient } = useWallet()

  // Simulated price information
  const getExchangeRate = (_from: string, _to: string) => {
    // If we have pool info, we could use real data here
    if (assetAInfo && assetBInfo) {
      const fromReserve = Number(assetAInfo.reserveA)
      const toReserve = Number(assetBInfo.reserveB)
      const amount = parseFloat(fromAmount)

      // Apply fee (e.g., 0.3% fee means fee numerator = 997, fee denominator = 1000)
      const FEE_NUM = 997
      const FEE_DEN = 1000

      // Calculate amount out using constant product formula: x * y = k
      // With fee: (x + amount_in * fee) * (y - amount_out) = x * y
      const amountInWithFee = (amount * FEE_NUM) / FEE_DEN
      const numerator = amountInWithFee * toReserve
      const denominator = fromReserve + amountInWithFee
      const amountOut = numerator / denominator

      return amountOut
    }
    return 1
  }

  // Calculate to amount based on from amount
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      const rate = getExchangeRate(fromToken, toToken)
      const calculated = parseFloat(fromAmount) * 0.786
      console.log('rate', rate)
      setToAmount(calculated.toString())
    } else {
      setToAmount('')
    }
  }, [fromAmount, fromToken, toToken])

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleSwap = async () => {
    // Mock swap functionality
    // alert(`Swap confirmed! Exchanging ${fromAmount} ${fromToken} for approximately ${toAmount} ${toToken}`)
    try {
      if (!activeAddress) {
        enqueueSnackbar('Active address is required', { variant: 'error' })
        // setLoading(false)
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

      const boxName = new Uint8Array([...new TextEncoder().encode('lp_'), ...algosdk.decodeAddress(activeAddress).publicKey])

      atc.addMethodCall({
        appID: appClient.appId,
        method: appClient.appClient.getABIMethod('swap'),
        methodArgs: [BigInt(1), BigInt(parseFloat(fromAmount)) * BigInt(10)],
        sender: activeAddress,
        suggestedParams,
        signer: transactionSigner,
        boxes: [
          {
            appIndex: 0,
            name: boxName,
          },
        ],
      })

      const assetIdA = BigInt(738849537)
      const assetIdB = BigInt(738849606)

      // Add asset transfers
      const assetATxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: BigInt(parseFloat(fromAmount)) * BigInt(10),
        assetIndex: BigInt(assetIdA),
        suggestedParams,
      })

      const bamout = parseInt(toAmount)
      const bigB = BigInt(bamout) * BigInt(10)

      // Wrap raw txns with signer
      atc.addTransaction({ txn: assetATxn, signer: transactionSigner })

      // Execute
      const result = await atc.execute(algodClient, 4)

      enqueueSnackbar(`Liquidity added! Group ID: ${result.txIDs.join(', ')}`, { variant: 'success' })
    } catch (error) {
      console.error('Error adding liquidity:', error)
      enqueueSnackbar(`Error adding liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error' })
    } finally {
      // setLoading(false)
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

      console.log('Is this the active wallet?', activeWallet?.isConnected)
      // await activeWallet?.connect()
      console.log('active address ', activeAddress)

      // Call the getPoolInfo function on the contract
      const response = await appClient.send.getPoolInfo({
        extraFee: AlgoAmount.Algos(0.1),
        args: [],
        signer: transactionSigner,
        sender: activeAddress,
      })

      enqueueSnackbar(`Pool info retrieved successfully`, { variant: 'success' })
      console.log('Pool info response:', response.return)
      if (response.return) {
        const assetAId = response.return[0]
        const assetBId = response.return[1]
        const reserveA = response.return[2]
        const reserveB = response.return[3]
        const totalLp = response.return[4]

        const assetA = await algodClient.getAssetByID(assetAId).do()
        const assetB = await algodClient.getAssetByID(assetBId).do()

        const assetADetails = {
          name: assetA.params.name || 'Unknown Asset',
          unitName: assetA.params.unitName || 'Unknown Asset',
          decimals: assetA.params.decimals,
          reserveA: reserveA,
        }
        console.log('Asset A Info:', assetADetails)
        setAssetAInfo(assetADetails)

        const assetBDetails = {
          name: assetB.params.name || 'Unknown Asset',
          unitName: assetB.params.unitName || 'Unknown Asset',
          decimals: assetB.params.decimals,
          reserveB: reserveB,
        }
        console.log('Asset B Info:', assetBDetails)
        setAssetBInfo(assetBDetails)
      } else {
        setAssetAInfo(null)
        setAssetBInfo(null)
      }
      setLoadingPoolInfo(false)
      return response.return
    } catch (error) {
      enqueueSnackbar(`Error getting pool info: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error' })
      setLoadingPoolInfo(false)
      return undefined
    }
  }

  const TokenSelector = ({
    value,
    onChange,
    show,
    setShow,
    position,
  }: {
    value: string
    onChange: (value: string) => void
    show: boolean
    setShow: (show: boolean) => void
    position: 'top' | 'bottom'
  }) => (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center space-x-2 bg-gray-300 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors"
      >
        <span className="text-xl">{tokens.find((t) => t.symbol === value)?.icon || '⟠'}</span>
        <span className="font-medium">{value}</span>
        <span className="text-gray-600">▼</span>
      </button>

      {show && (
        <div
          className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 bg-white rounded-xl shadow-xl border border-gray-200 w-64 z-10`}
        >
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">Select Token</h3>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {tokens.map((token) => (
              <div
                key={token.symbol}
                onClick={() => {
                  onChange(token.symbol)
                  setShow(false)
                }}
                className={`flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg cursor-pointer ${
                  token.symbol === value ? 'bg-purple-50 border border-purple-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">{token.icon}</div>
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-xs text-gray-500">{token.name}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">{token.balance}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-transparent border-white border-2 bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Swap</h1>
          <div className="flex space-x-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings size={20} className="text-gray-600" />
            </button>
            <button onClick={getPoolInfo} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" disabled={loadingPoolInfo}>
              <Database size={20} className={`${loadingPoolInfo ? 'animate-pulse text-purple-600' : 'text-gray-600'}`} />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <RefreshCw size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-200 rounded-xl p-4 space-y-4 border border-gray-300">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slippage Tolerance</label>
              <div className="flex space-x-2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      slippage === value ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    className="w-16 px-2 py-1 text-sm rounded-lg border-gray-300 border"
                  />
                  <span className="absolute right-2 text-gray-500">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Speed</label>
              <div className="flex space-x-2">
                {['Standard', 'Fast', 'Instant'].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setTxnSpeed(speed)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      txnSpeed === speed ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gas Price (GWEI)</label>
              <input
                type="number"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border-gray-300 border"
              />
            </div>
          </div>
        )}

        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-600">From</label>
            {/* <span className="text-sm text-gray-500">Balance: {tokens.find((t) => t.symbol === fromToken)?.balance || '0.00'}</span> */}
          </div>
          <div className="flex items-center rounded-2xl px-4 py-3 bg-gray-200 border border-gray-300 hover:border-purple-300 focus-within:border-purple-500 transition-colors">
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none text-lg"
            />
            <TokenSelector
              value={fromToken}
              onChange={setFromToken}
              show={showTokenListFrom}
              setShow={setShowTokenListFrom}
              position="bottom"
            />
          </div>
          <div className="flex justify-end">
            <div className="space-x-2">
              <button
                onClick={() => setFromAmount((tokens.find((t) => t.symbol === fromToken)?.balance || '0').replace(',', ''))}
                className="text-xs text-purple-600 font-medium hover:text-purple-800"
              >
                MAX
              </button>
              <button
                onClick={() => setFromAmount((parseFloat(tokens.find((t) => t.symbol === fromToken)?.balance || '0') / 2).toString())}
                className="text-xs text-purple-600 font-medium hover:text-purple-800"
              >
                HALF
              </button>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1">
          <button
            onClick={handleSwapTokens}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md transform transition-transform hover:rotate-180 hover:scale-110 z-10"
          >
            <ArrowDownCircle size={24} className="text-purple-600" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-600">To (estimated)</label>
            {/* <span className="text-sm text-gray-500">Balance: {tokens.find((t) => t.symbol === toToken)?.balance || '0.00'}</span> */}
          </div>
          <div className="flex items-center rounded-2xl px-4 py-3 bg-gray-200 border border-gray-300 hover:border-purple-300 focus-within:border-purple-500 transition-colors">
            <input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="flex-1 bg-transparent outline-none text-lg text-gray-700"
            />
            <TokenSelector value={toToken} onChange={setToToken} show={showTokenListTo} setShow={setShowTokenListTo} position="top" />
          </div>
        </div>

        {/* Price and Route info */}
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <div className="bg-gray-200 rounded-xl p-3 space-y-2 border border-gray-300">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price</span>
              <span className="font-medium">
                1 {fromToken} = {getExchangeRate(fromToken, toToken)} {toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Gas</span>
              <span className="font-medium">~0.004 Algo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Route</span>
              <span className="font-medium flex items-center">
                <span>{fromToken}</span>
                <span className="mx-1">→</span>
                <span>{toToken}</span>
                <Info size={14} className="ml-1 text-gray-400" />
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Source</span>
              <span className="font-medium text-purple-600">{liquiditySource}</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          className={`w-full py-4 rounded-xl text-lg font-semibold transition duration-200 ${
            !fromAmount || parseFloat(fromAmount) <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {!fromAmount || parseFloat(fromAmount) <= 0 ? 'Enter an amount' : 'Swap'}
        </button>
      </div>

      {/* Info footer */}
      <div className="mt-4 text-center text-white text-opacity-70 text-sm">Powered by decentralized liquidity protocols</div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default SwapInterface
