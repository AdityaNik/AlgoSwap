import React, { useState, useEffect } from 'react'
import { ArrowDownCircle, Settings, Info, RefreshCw } from 'lucide-react'
import ConnectWallet from './components/ConnectWallet'

// Token data with icons
const tokens = [
  { symbol: 'ETH', name: 'Ethereum', balance: '1.45', icon: '⟠' },
  { symbol: 'DAI', name: 'Dai Stablecoin', balance: '2,450.00', icon: '◈' },
  { symbol: 'USDC', name: 'USD Coin', balance: '3,120.50', icon: '$' },
  { symbol: 'USDT', name: 'Tether', balance: '1,890.75', icon: '₮' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.12', icon: '₿' },
  { symbol: 'UNI', name: 'Uniswap', balance: '215.40', icon: '🦄' },
]

// Price mapping
const priceMap = {
  'ETH-DAI': 2950.75,
  'ETH-USDC': 2951.2,
  'ETH-USDT': 2949.9,
  'ETH-WBTC': 0.064,
  'ETH-UNI': 118.5,
  'DAI-USDC': 1.001,
  'DAI-USDT': 0.999,
  'DAI-WBTC': 0.000022,
  'DAI-UNI': 0.04,
  'USDC-USDT': 0.999,
  'USDC-WBTC': 0.000022,
  'USDC-UNI': 0.04,
  'USDT-WBTC': 0.000022,
  'USDT-UNI': 0.04,
  'WBTC-UNI': 1842.5,
}

interface ConnectWalletInterface {
  openWalletModal: boolean
  toggleWalletModal: () => void
}

const SwapInterface = ({ openWalletModal, toggleWalletModal }: ConnectWalletInterface) => {
  const [fromToken, setFromToken] = useState('ETH')
  const [toToken, setToToken] = useState('DAI')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenListFrom, setShowTokenListFrom] = useState(false)
  const [showTokenListTo, setShowTokenListTo] = useState(false)
  const [gasPrice, setGasPrice] = useState('12')
  const [txnSpeed, setTxnSpeed] = useState('Standard')
  const [liquiditySource, setLiquiditySource] = useState('Uniswap V3')

  // Simulated price information
  const getExchangeRate = (from, to) => {
    const key = `${from}-${to}`
    const reverseKey = `${to}-${from}`

    if (priceMap[key]) {
      return priceMap[key]
    } else if (priceMap[reverseKey]) {
      return 1 / priceMap[reverseKey]
    } else {
      return 1 // Fallback
    }
  }

  // Calculate to amount based on from amount
  useEffect(() => {
    if (fromAmount && fromAmount > 0) {
      const rate = getExchangeRate(fromToken, toToken)
      const calculated = (parseFloat(fromAmount) * rate).toFixed(6)
      setToAmount(calculated)
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

  const handleSwap = () => {
    // Mock swap functionality
    alert(`Swap confirmed! Exchanging ${fromAmount} ${fromToken} for approximately ${toAmount} ${toToken}`)
    setFromAmount('')
    setToAmount('')
  }

  const TokenSelector = ({ value, onChange, show, setShow, position }) => (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors"
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="w-full max-w-md bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Swap</h1>
          <div className="flex space-x-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <RefreshCw size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
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
                    onChange={(e) => setSlippage(e.target.value)}
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
            <span className="text-sm text-gray-500">Balance: {tokens.find((t) => t.symbol === fromToken)?.balance || '0.00'}</span>
          </div>
          <div className="flex items-center rounded-2xl px-4 py-3 bg-gray-50 border border-gray-200 hover:border-purple-300 focus-within:border-purple-500 transition-colors">
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
            <span className="text-sm text-gray-500">Balance: {tokens.find((t) => t.symbol === toToken)?.balance || '0.00'}</span>
          </div>
          <div className="flex items-center rounded-2xl px-4 py-3 bg-gray-50 border border-gray-200 hover:border-purple-300 focus-within:border-purple-500 transition-colors">
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
        {fromAmount && fromAmount > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price</span>
              <span className="font-medium">
                1 {fromToken} = {getExchangeRate(fromToken, toToken).toFixed(6)} {toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Gas</span>
              <span className="font-medium">~0.004 ETH</span>
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
