import { useWallet } from "@txnlab/use-wallet-react"
import { TrendingUp, Settings, Database, RefreshCw, ArrowDownCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { SettingsPanel } from "./SettingPanel"
import { TokenInput } from "./TokenInput"
import { PriceInfo } from "./PriceInfo"
import { enqueueSnackbar } from "notistack"
import { getAppClient } from "./GetAppClient"
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount"
import { getAssetInfo } from "../utils/getAssetInfo"
import algosdk, { makeAssetTransferTxnWithSuggestedParamsFromObject } from "algosdk"
import ConnectWallet from "./ConnectWallet"
import { useWalletUI } from "../context/WalletContext"

export type Token = {
  symbol: string
  name: string
  balance: string
  icon: string
  id: string
}

export const mockTokens = [
  { symbol: 'ALGO', name: 'Algorand', balance: '62', icon: '⬢', id: '0' },
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
  const {activeAddress, transactionSigner, activeWallet} = useWallet()
  const {toggleWalletModal, openWalletModal} = useWalletUI();

  // Calculate to amount based on from amount
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      // const rate = getExchangeRate(fromToken, toToken)
      const calculated = parseFloat(fromAmount) * 0.786
      // console.log('rate', rate)
      setToAmount(calculated.toString())
    } else {
      setToAmount('')
    }
  }, [fromAmount, fromToken, toToken])

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
        methodArgs: [BigInt(fromToken?.id ?? 0), BigInt(toToken?.id ?? 0), BigInt(fromToken?.id ?? 0), BigInt(parseFloat(fromAmount) * 10)],
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

      const assetATxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        assetIndex: BigInt(fromToken?.id || 0),
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: BigInt(parseFloat(fromAmount)) * BigInt(10),
        suggestedParams,
      })

      const bamout = parseInt(toAmount)
      const bigB = BigInt(bamout) * BigInt(10)

      atc.addTransaction({ txn: assetATxn, signer: transactionSigner })

      const result = await atc.execute(algodClient, 4)

      enqueueSnackbar(`Swapped successfully! Transaction ID: ${result.txIDs}`, { variant: 'success' })
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

      console.log('Pool exists response:', res.return)

      if(res.return === false) {
        enqueueSnackbar('Pool does not exist for the selected tokens', { variant: 'error' })
        setLoadingPoolInfo(false)
        return undefined
      }
      enqueueSnackbar('Pool exists, retrieving info...', { variant: 'success' })

      const response = await appClient.send.getPoolInfo({
        extraFee: AlgoAmount.Algos(0.1),
        args: [BigInt(fromToken.id), BigInt(toToken.id)],
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

        const assetA = await getAssetInfo(assetAId)
        const assetB = await getAssetInfo(assetBId)

        const assetADetails = {
          name: assetA?.assetInfo.params.name || 'Unknown Asset',
          unitName: assetA?.assetInfo.params.unitName || 'Unknown Asset',
          decimals: assetA?.assetInfo.params.decimals,
          reserveA: reserveA,
          id: assetAId
        }
        console.log('Asset A Info:', assetADetails)
        setAssetAInfo(assetADetails)

        const assetBDetails = {
          name: assetB?.assetInfo.params.name || 'Unknown Asset',
          unitName: assetB?.assetInfo.params.unitName || 'Unknown Asset',
          decimals: assetB?.assetInfo.params.decimals,
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
            <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200">
              <RefreshCw size={18} className="text-white" />
            </button>
          </div>
        </div>

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
          disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg ${
            !fromAmount || parseFloat(fromAmount) <= 0
              ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-2xl hover:scale-105 active:scale-95'
          }`}
        >
          {!fromAmount || parseFloat(fromAmount) <= 0
            ? 'Enter an amount'
            : !activeAddress
            ? 'Connect Wallet'
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
