import React, { useState, useEffect } from 'react'
import { ChevronDown, ArrowRightLeft, Clock, AlertCircle, CheckCircle, Info, ArrowRight, Wallet, Send, Download } from 'lucide-react'
import ConnectWallet from './ConnectWallet'
import { ConnectEthWallet } from './ConnectEthWallet'
import { useAccount } from 'wagmi'

// Mock data for demonstration
const useWalletUI = () => ({
  openWalletModal: false,
  toggleWalletModal: () => {},
})

const enqueueSnackbar = (message: string, options: { variant: string }) => {
  console.log(message, options)
}

// Updated network and token data
const networks = [
  { name: 'Ethereum', icon: '⟠', chainId: 1 },
  { name: 'Algorand', icon: '◈', chainId: 'algorand-mainnet' },
]

type NetworkName = 'Ethereum' | 'Algorand'

const networkTokens: Record<
  NetworkName,
  {
    symbol: string
    name: string
    icon: string
    address: string
    price: number
    minAmount: number
    maxAmount: number
  }[]
> = {
  Ethereum: [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', address: 'native', price: 3500, minAmount: 0.001, maxAmount: 100 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💰', address: '0xa0b8...', price: 1, minAmount: 1, maxAmount: 100000 },
  ],
  Algorand: [
    { symbol: 'ALGO', name: 'Algorand', icon: '◈', address: 'native', price: 0.25, minAmount: 100, maxAmount: 1000000 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💰', address: '31566704', price: 1, minAmount: 1, maxAmount: 100000 },
  ],
}

// Get bridgeable tokens
const getBridgeableTokens = (networkName: string) => {
  return networkTokens[networkName as NetworkName] || []
}

/**
 * Returns the wrapped token on the destination network for a given token.
 */
function getWrappedToken(
  token: { symbol: any; name?: string; icon?: string; address?: string; price?: number; minAmount?: number; maxAmount?: number },
  destinationNetwork: string,
) {
  if (!token || !destinationNetwork) return null
  if (token.symbol === 'ETH' && destinationNetwork === 'Algorand') {
    return { symbol: 'wETH', name: 'Wrapped Ethereum', icon: '⟠', address: '887406851', price: 3500, minAmount: 0.001, maxAmount: 100 }
  }
  if (token.symbol === 'ALGO' && destinationNetwork === 'Ethereum') {
    return { symbol: 'wALGO', name: 'Wrapped Algorand', icon: '◈', address: '0x123...', price: 0.25, minAmount: 100, maxAmount: 1000000 }
  }
  return null
}

type BridgeStep = 1 | 2 | 3 | 4

const BridgeInterface = () => {
  const { openWalletModal, toggleWalletModal } = useWalletUI()

  // Current step in the bridge process
  const [currentStep, setCurrentStep] = useState<BridgeStep>(1)

  // Network and token selection
  const [fromNetwork, setFromNetwork] = useState(networks[1]) // Start with Algorand
  const [toNetwork, setToNetwork] = useState(networks[0]) // Target Ethereum
  const [showFromNetworks, setShowFromNetworks] = useState(false)
  const [showToNetworks, setShowToNetworks] = useState(false)

  // Token selection
  const [fromToken, setFromToken] = useState(getBridgeableTokens(networks[1].name)[0])
  const [showFromTokens, setShowFromTokens] = useState(false)

  // Transaction details
  const [amount, setAmount] = useState('')
  const [targetAddress, setTargetAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [bridgeFee] = useState(0.1) // 0.1% bridge fee
  const [gasEstimate] = useState('$5.72')

  // Get the wrapped token that will be received
  const toToken = fromToken ? getWrappedToken(fromToken, toNetwork?.name) : null

  // Calculations
  const receiveAmount = amount && !isNaN(Number(amount)) ? Number(amount).toFixed(6) : ''
  const feeAmount = amount && !isNaN(Number(amount)) ? ((Number(amount) * bridgeFee) / 100).toFixed(6) : '0'

  // Validation
  const isValidAmount = amount && !isNaN(Number(amount)) && Number(amount) > 0
  const isWithinLimits = fromToken && isValidAmount ? Number(amount) >= fromToken.minAmount && Number(amount) <= fromToken.maxAmount : false
  const isValidTargetAddress =
    toNetwork?.name === 'Ethereum' ? targetAddress.startsWith('0x') && targetAddress.length === 42 : targetAddress.length === 58

  // State for showing Ethereum wallet connect dialog
  const [showWalletConnect, setShowWalletConnect] = useState(false)
  const {isConnected} = useAccount();

  // Step completion checks
  const canProceedStep1 = fromNetwork && toNetwork && fromToken && toToken
  const canProceedStep2 = canProceedStep1 && isValidTargetAddress
  const canProceedStep3 = canProceedStep2 && isValidAmount && isWithinLimits && isConnected
  const canProceedStep4 = canProceedStep3 && transactionHash

  // Handle network changes
  const handleFromNetworkChange = (n: (typeof networks)[0]) => {
    setFromNetwork(n)
    const bridgeableTokens = getBridgeableTokens(n.name)
    setFromToken(bridgeableTokens[0] || null)
    setShowFromNetworks(false)
    setCurrentStep(1) // Reset to step 1 when changing networks
  }

  const handleToNetworkChange = (n: (typeof networks)[0]) => {
    setToNetwork(n)
    setShowToNetworks(false)
    setCurrentStep(1) // Reset to step 1
  }

  // Swap networks
  const handleSwapNetworks = () => {
    if (!toNetwork) return
    const prevFrom = fromNetwork
    setFromNetwork(toNetwork)
    setToNetwork(prevFrom)

    const bridgeableTokens = getBridgeableTokens(toNetwork.name)
    setFromToken(bridgeableTokens[0] || null)
    setCurrentStep(1)
  }

  // Handle send tokens transaction
  const handleSendTokens = async () => {
    if (!canProceedStep3) return

    setIsProcessing(true)
    try {
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      setTransactionHash(mockTxHash)
      setCurrentStep(4)
      enqueueSnackbar('Tokens sent successfully!', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Transaction failed!', { variant: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle redeem tokens
  const handleRedeemTokens = async () => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      enqueueSnackbar('Tokens redeemed successfully!', { variant: 'success' })
      // Reset for new transaction
      setCurrentStep(1)
      setAmount('')
      setTargetAddress('')
      setTransactionHash('')
    } catch (error) {
      enqueueSnackbar('Redeem failed!', { variant: 'error' })
    } finally {
      setIsProcessing(false)
    }
  }

  const stepTitles = {
    1: 'SOURCE',
    2: 'TARGET',
    3: 'SEND TOKENS',
    4: 'REDEEM TOKENS',
  }

  const stepDescriptions = {
    1: 'Select tokens to send through the Portal.',
    2: 'Select the target chain and enter recipient address.',
    3: 'Send tokens to the Portal for wrapping.',
    4: 'Redeem wrapped tokens on the target chain.',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl p-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Portal Token Bridge
          </h2>
          <p className="text-white/70">Transfer tokens across different blockchain networks</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 text-white/50 border border-white/20'
                }
              `}
              >
                {currentStep > step ? <CheckCircle size={20} /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`
                  w-16 h-0.5 mx-2
                  ${currentStep > step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'}
                `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                {currentStep}. {stepTitles[currentStep]}
              </h3>
              <p className="text-white/70 text-sm mt-1">{stepDescriptions[currentStep]}</p>
            </div>
            {currentStep === 1 && (
              <div className="flex items-center px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                <CheckCircle size={16} className="mr-1" />
                TOKEN ORIGIN VERIFIED
              </div>
            )}
          </div>

          {/* Step 1: Source */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Source Network */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/90">Source</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowFromNetworks(!showFromNetworks)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-blue-500/20 border-2 border-blue-400/50 rounded-xl text-white font-semibold"
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-xl">{fromNetwork?.icon}</span>
                        <span>{fromNetwork?.name}</span>
                      </span>
                      <ChevronDown size={18} />
                    </button>
                    {showFromNetworks && (
                      <div className="absolute left-0 right-0 mt-2 bg-white/10 rounded-xl shadow-lg z-10">
                        {networks
                          .filter((n) => n.name !== toNetwork?.name)
                          .map((n) => (
                            <div
                              key={n.name}
                              onClick={() => handleFromNetworkChange(n)}
                              className="px-4 py-3 hover:bg-purple-500/20 cursor-pointer flex items-center space-x-2"
                            >
                              <span className="text-xl">{n.icon}</span>
                              <span>{n.name}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Network */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/90">Target</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowToNetworks(!showToNetworks)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-semibold"
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-xl">{toNetwork?.icon}</span>
                        <span>{toNetwork?.name}</span>
                      </span>
                      <ChevronDown size={18} />
                    </button>
                    {showToNetworks && (
                      <div className="absolute left-0 right-0 mt-2 bg-white/10 rounded-xl shadow-lg z-10">
                        {networks
                          .filter((n) => n.name !== fromNetwork?.name)
                          .map((n) => (
                            <div
                              key={n.name}
                              onClick={() => handleToNetworkChange(n)}
                              className="px-4 py-3 hover:bg-pink-500/20 cursor-pointer flex items-center space-x-2"
                            >
                              <span className="text-xl">{n.icon}</span>
                              <span>{n.name}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Swap Networks Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapNetworks}
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-full shadow-lg border border-white/20 transform transition-all duration-300 hover:rotate-180 hover:scale-110"
                >
                  <ArrowRightLeft size={24} className="text-purple-400" />
                </button>
              </div>

              {/* Token Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/90">Token</label>
                <div className="relative">
                  <button
                    onClick={() => setShowFromTokens(!showFromTokens)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-semibold"
                  >
                    <span className="flex items-center space-x-3">
                      <span className="text-2xl">{fromToken?.icon}</span>
                      <div>
                        <div className="font-bold">{fromToken?.symbol}</div>
                        <div className="text-xs text-white/60">{fromToken?.name}</div>
                      </div>
                    </span>
                    <ChevronDown size={18} />
                  </button>
                  {showFromTokens && (
                    <div className="absolute left-0 right-0 mt-2 bg-white/10 rounded-xl shadow-lg z-10">
                      {getBridgeableTokens(fromNetwork.name).map((t) => (
                        <div
                          key={t.symbol}
                          onClick={() => {
                            setFromToken(t)
                            setShowFromTokens(false)
                          }}
                          className="px-4 py-3 hover:bg-purple-500/20 cursor-pointer flex items-center space-x-3"
                        >
                          <span className="text-xl">{t.icon}</span>
                          <div>
                            <div className="font-medium">{t.symbol}</div>
                            <div className="text-xs text-white/60">{t.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {fromNetwork?.name === 'Ethereum' && (
                <ConnectEthWallet onClose={() => setShowWalletConnect(false)} showWalletConnect={showWalletConnect} />
              )}
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedStep1}
                className="w-full px-6 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed"
              >
                NEXT
              </button>
            </div>
          )}

          {/* Step 2: Target */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/70">From</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{fromToken?.icon}</span>
                      <span className="font-semibold">{fromToken?.symbol}</span>
                      <span className="text-white/60">on {fromNetwork?.name}</span>
                    </div>
                  </div>
                  <ArrowRight className="text-purple-400" />
                  <div>
                    <div className="text-sm text-white/70">To</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{toToken?.icon}</span>
                      <span className="font-semibold">{toToken?.symbol}</span>
                      <span className="text-white/60">on {toNetwork?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/90">Recipient Address on {toNetwork?.name}</label>
                <input
                  type="text"
                  placeholder={`Enter ${toNetwork?.name} address...`}
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 outline-none focus:border-purple-400"
                />
                {targetAddress && !isValidTargetAddress && (
                  <p className="text-red-400 text-xs mt-1">Please enter a valid {toNetwork?.name} address</p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-6 py-4 rounded-xl text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  BACK
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 px-6 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Send Tokens */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-white/70">Sending</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{fromToken?.icon}</span>
                      <span className="font-semibold">{fromToken?.symbol}</span>
                    </div>
                  </div>
                  <ArrowRight className="text-purple-400" />
                  <div>
                    <div className="text-sm text-white/70">Receiving</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{toToken?.icon}</span>
                      <span className="font-semibold">{toToken?.symbol}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/60">
                  To: {targetAddress.slice(0, 10)}...{targetAddress.slice(-8)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/90">Amount</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-xl font-bold text-white placeholder-white/40 outline-none focus:border-purple-400"
                />
                {fromToken && (
                  <div className="flex justify-between mt-1">
                    <span className="text-white/60 text-sm">
                      ≈ ${fromToken && amount ? (Number(amount) * fromToken.price).toLocaleString() : '0.00'}
                    </span>
                    <span className="text-xs text-white/40">
                      Min: {fromToken.minAmount} • Max: {fromToken.maxAmount}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Bridge Fee (0.1%)</span>
                  <span className="font-semibold">
                    {feeAmount} {fromToken?.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Gas Fee</span>
                  <span className="font-semibold">{gasEstimate}</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 px-6 py-4 rounded-xl text-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  BACK
                </button>
                <button
                  onClick={handleSendTokens}
                  disabled={!canProceedStep3 || isProcessing}
                  className="flex-1 px-6 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send size={20} />
                  <span>{isProcessing ? 'SENDING...' : 'SEND TOKENS'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Redeem Tokens */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <div className="font-semibold text-green-300">Tokens Sent Successfully!</div>
                <div className="text-xs text-green-200/80 mt-1">Transaction Hash: {transactionHash}</div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-center mb-4">
                  <div className="text-sm text-white/70 mb-2">Ready to Redeem</div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">{toToken?.icon}</span>
                    <span className="text-xl font-bold">
                      {receiveAmount} {toToken?.symbol}
                    </span>
                  </div>
                  <div className="text-white/60 text-sm">on {toNetwork?.name}</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-semibold text-yellow-300 mb-1">Final Step</div>
                    <div className="text-yellow-200/80">Complete the process by redeeming your wrapped tokens on {toNetwork?.name}.</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRedeemTokens}
                disabled={isProcessing}
                className="w-full px-6 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Download size={20} />
                <span>{isProcessing ? 'REDEEMING...' : 'REDEEM TOKENS'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default BridgeInterface
