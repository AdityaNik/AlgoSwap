import React, { useState, useEffect } from 'react'
import { ArrowDownCircle, Settings, Info, RefreshCw, Database, ChevronDown, Zap, TrendingUp } from 'lucide-react'
import ConnectWallet from './ConnectWallet'
import { getAppClient } from './GetAppClient'
import { useWallet } from '@txnlab/use-wallet-react'
import { enqueueSnackbar } from 'notistack'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import algosdk, { makeAssetTransferTxnWithSuggestedParamsFromObject } from 'algosdk'
import { useWalletUI } from '../context/WalletContext'

// Token data with icons
const tokens = [
  { symbol: 'TOKA', name: 'Token A', balance: '1', icon: '⟠' },
  { symbol: 'TOKB', name: 'Token B', balance: '2,450.00', icon: '◈' },
]

const SwapInterface = () => {
  const { openWalletModal, toggleWalletModal } = useWalletUI()

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
  const [assetAInfo, setAssetAInfo] = useState({ name: '', unitName: '', decimals: 0, reserveA: 0n })
  const [assetBInfo, setAssetBInfo] = useState({ name: '', unitName: '', decimals: 0, reserveB: 0n })

  const { activeAddress, transactionSigner, activeWallet, algodClient } = useWallet()

  // Simulated price information
  const getExchangeRate = (_from, _to) => {
    if (assetAInfo && assetBInfo) {
      const fromReserve = Number(assetAInfo.reserveA)
      const toReserve = Number(assetBInfo.reserveB)
      const amount = parseFloat(fromAmount)

      const FEE_NUM = 997
      const FEE_DEN = 1000

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
    try {
      if (!activeAddress) {
        enqueueSnackbar('Active address is required', { variant: 'error' })
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

      const assetATxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: BigInt(parseFloat(fromAmount)) * BigInt(10),
        assetIndex: BigInt(assetIdA),
        suggestedParams,
      })

      const bamout = parseInt(toAmount)
      const bigB = BigInt(bamout) * BigInt(10)

      atc.addTransaction({ txn: assetATxn, signer: transactionSigner })

      const result = await atc.execute(algodClient, 4)

      enqueueSnackbar(`Liquidity added! Group ID: ${result.txIDs.join(', ')}`, { variant: 'success' })
    } catch (error) {
      console.error('Error adding liquidity:', error)
      enqueueSnackbar(`Error adding liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`, { variant: 'error' })
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

      console.log('Is this the active wallet?', activeWallet?.isConnected)
      console.log('active address ', activeAddress)

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

  const TokenSelector = ({ value, onChange, show, setShow, position }) => (
    <div className="relative text-right min-w-[100px]">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center space-x-1 text-white font-semibold text-base px-2 py-1 bg-transparent"
      >
        <span className="text-xl">{tokens.find((t) => t.symbol === value)?.icon || '⟠'}</span>
        <span>{value}</span>
        <ChevronDown size={16} className="text-white/70" />
      </button>

      {show && (
        <div
          className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-72 z-20 overflow-hidden`}
        >
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-white">Select Token</h3>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {tokens.map((token) => (
              <div
                key={token.symbol}
                onClick={() => {
                  onChange(token.symbol)
                  setShow(false)
                }}
                className={`flex items-center justify-between p-4 hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200 ${
                  token.symbol === value ? 'bg-purple-500/20 border border-purple-400/50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{token.icon}</div>
                  <div>
                    <div className="font-bold text-white">{token.symbol}</div>
                    <div className="text-sm text-white/70">{token.name}</div>
                  </div>
                </div>
                <div className="text-sm text-white/80 font-medium">{token.balance}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Swap</h1>
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
            <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200">
              <RefreshCw size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-6 border border-white/10 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Slippage Tolerance</label>
              <div className="flex space-x-2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      slippage === value
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
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
                    className="w-20 px-3 py-2 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                  <span className="absolute right-3 text-white/70 text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Transaction Speed</label>
              <div className="flex space-x-2">
                {[
                  { name: 'Standard', icon: null },
                  { name: 'Fast', icon: null },
                  { name: 'Instant', icon: <Zap size={14} /> },
                ].map((speed) => (
                  <button
                    key={speed.name}
                    onClick={() => setTxnSpeed(speed.name)}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      txnSpeed === speed.name
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {speed.icon}
                    <span>{speed.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Gas Price (GWEI)</label>
              <input
                type="number"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Enter gas price"
              />
            </div>
          </div>
        )}

        {/* From Token */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-white/90">From</label>
            <span className="text-sm text-white/60">Balance: {tokens.find((t) => t.symbol === fromToken)?.balance || '0.00'}</span>
          </div>
          <div className="">
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 transition-all duration-200">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent outline-none text-2xl font-bold text-white placeholder-white/40"
              />
              <TokenSelector
                value={fromToken}
                onChange={setFromToken}
                show={showTokenListFrom}
                setShow={setShowTokenListFrom}
                position="top"
              />
            </div>
          </div>
            <div className="flex justify-end mt-2 space-x-3">
              <button
                onClick={() => setFromAmount((tokens.find((t) => t.symbol === fromToken)?.balance || '0').replace(',', ''))}
                className="text-sm text-purple-400 font-semibold hover:text-purple-300 transition-colors"
              >
                MAX
              </button>
              <button
                onClick={() => setFromAmount((parseFloat(tokens.find((t) => t.symbol === fromToken)?.balance || '0') / 2).toString())}
                className="text-sm text-purple-400 font-semibold hover:text-purple-300 transition-colors"
              >
                HALF
              </button>
            </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-white/10 hover:bg-white/20 p-3 rounded-full shadow-lg border border-white/20 transform transition-all duration-300 hover:rotate-180 hover:scale-110 backdrop-blur-sm"
          >
            <ArrowDownCircle size={28} className="text-purple-400" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-white/90">To (estimated)</label>
            <span className="text-sm text-white/60">Balance: {tokens.find((t) => t.symbol === toToken)?.balance || '0.00'}</span>
          </div>
          <div className="flex items-center rounded-2xl px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-all duration-200">
            <input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="flex-1 bg-transparent outline-none text-2xl font-bold text-white/80 placeholder-white/40"
            />
            <TokenSelector value={toToken} onChange={setToToken} show={showTokenListTo} setShow={setShowTokenListTo} position="top" />
          </div>
        </div>

        {/* Price and Route info */}
        {fromAmount && parseFloat(fromAmount) > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 space-y-3 border border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Price</span>
              <span className="font-semibold text-white">
                1 {fromToken} = {getExchangeRate(fromToken, toToken).toFixed(6)} {toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Estimated Gas</span>
              <span className="font-semibold text-white">~0.004 ALGO</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-white/70">Route</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white">{fromToken}</span>
                <div className="w-4 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded"></div>
                <span className="font-semibold text-white">{toToken}</span>
                <Info size={14} className="text-white/50" />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Source</span>
              <span className="font-semibold text-purple-400">{liquiditySource}</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg ${
            !fromAmount || parseFloat(fromAmount) <= 0
              ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95'
          }`}
        >
          {!fromAmount || parseFloat(fromAmount) <= 0 ? 'Enter an amount' : !activeAddress ? 'Connect Wallet' : 'Swap Tokens'}
        </button>
      </div>

      {/* Info footer */}
      <div className="mt-8 text-center text-white/60 text-sm font-medium">🚀 Powered by decentralized liquidity protocols</div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default SwapInterface
