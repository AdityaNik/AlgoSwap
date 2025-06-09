import { useState } from 'react'
import { useWalletUI } from '../context/WalletContext'
import ConnectWallet from './ConnectWallet'
import { ChevronDown, ArrowRightLeft } from 'lucide-react'
import { enqueueSnackbar } from 'notistack'

const networks = [
  { name: 'Ethereum', icon: '⟠' },
  { name: 'Algorand', icon: '◈' },
]

type Network = { name: string; icon: string }
type Token = { symbol: string; name: string; icon: string; price: number }

// Example tokens per network (in a real app, this would be dynamic)
const networkTokens: Record<string, Token[]> = {
  'Ethereum': [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', price: 2498.61 },
    { symbol: 'USDC', name: 'USD Coin', icon: '$', price: 1 },
  ],
  'BNB Chain': [
    { symbol: 'BNB', name: 'BNB', icon: '🟡', price: 649.01 },
    { symbol: 'USDC', name: 'USD Coin', icon: '$', price: 1 },
  ],
  'Algorand': [
    { symbol: 'ALGO', name: 'Algorand', icon: '◈', price: 0.18 },
    { symbol: 'USDC', name: 'USD Coin', icon: '$', price: 1 },
  ],
  'Polygon': [
    { symbol: 'MATIC', name: 'Polygon', icon: '⬡', price: 0.72 },
    { symbol: 'USDC', name: 'USD Coin', icon: '$', price: 1 },
  ],
}

const BridgeInterface = () => {
  const { openWalletModal, toggleWalletModal } = useWalletUI();
  const [fromNetwork, setFromNetwork] = useState<Network>(networks[0])
  const [toNetwork, setToNetwork] = useState<Network | null>(networks[1])
  const [showFromNetworks, setShowFromNetworks] = useState(false)
  const [showToNetworks, setShowToNetworks] = useState(false)

  // Token selection for both sides
  const [fromToken, setFromToken] = useState<Token | null>(networkTokens[networks[0].name][0])
  const [toToken, setToToken] = useState<Token | null>(networkTokens[networks[1].name][0])
  const [showFromTokens, setShowFromTokens] = useState(false)
  const [showToTokens, setShowToTokens] = useState(false)

  const [amount, setAmount] = useState('')
  // Simulate a bridge rate (e.g., 1 ETH = 3.79 BNB)
  const bridgeRate = fromToken && toToken ? (fromToken.price / toToken.price) : 1
  const receiveAmount = amount && !isNaN(Number(amount)) ? (Number(amount) * bridgeRate).toFixed(6) : ''

  // Fiat values (placeholder)
  const fromFiat = fromToken && amount ? `≈ $${(Number(amount) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''
  const toFiat = toToken && receiveAmount ? `≈ $${(Number(receiveAmount) * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''

  // Update tokens when network changes
  const handleFromNetworkChange = (n: Network) => {
    setFromNetwork(n)
    setFromToken(networkTokens[n.name][0])
    setShowFromNetworks(false)
  }
  const handleToNetworkChange = (n: Network) => {
    setToNetwork(n)
    setToToken(networkTokens[n.name][0])
    setShowToNetworks(false)
  }

  // Swap networks and tokens
  const handleSwapNetworks = () => {
    if (!toNetwork) return
    const prevFrom = fromNetwork
    const prevFromToken = fromToken
    setFromNetwork(toNetwork)
    setFromToken(toToken)
    setToNetwork(prevFrom)
    setToToken(prevFromToken)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>
      <div className="relative w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Bridge tokens</h2>
            <p className="text-white/70 text-sm">Transfer your tokens from one network to another.</p>
          </div>
        </div>
        {/* Networks */}
        <div className="grid grid-cols-2 gap-4">
          {/* From Network */}
          <div>
            <label className="block text-sm font-semibold mb-2">From this network</label>
            <div className="relative">
              <button onClick={() => setShowFromNetworks(!showFromNetworks)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-semibold">
                <span className="flex items-center space-x-2">
                  <span className="text-xl">{fromNetwork?.icon}</span>
                  <span>{fromNetwork?.name || 'Select a network'}</span>
                </span>
                <ChevronDown size={18} />
              </button>
              {showFromNetworks && (
                <div className="absolute left-0 right-0 mt-2 bg-white/10 rounded-xl shadow-lg z-10">
                  {networks.filter(n => n.name !== toNetwork?.name).map((n) => (
                    <div key={n.name} onClick={() => handleFromNetworkChange(n)} className="px-4 py-3 hover:bg-purple-500/20 cursor-pointer flex items-center space-x-2">
                      <span className="text-xl">{n.icon}</span>
                      <span>{n.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* To Network */}
          <div>
            <label className="block text-sm font-semibold mb-2">To this network</label>
            <div className="relative">
              <button onClick={() => setShowToNetworks(!showToNetworks)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white font-semibold">
                <span className="flex items-center space-x-2">
                  <span className="text-xl">{toNetwork?.icon || <span className="opacity-50">●</span>}</span>
                  <span>{toNetwork?.name || 'Select a network'}</span>
                </span>
                <ChevronDown size={18} />
              </button>
              {showToNetworks && (
                <div className="absolute left-0 right-0 mt-2 bg-white/10 rounded-xl shadow-lg z-10">
                  {networks.filter(n => n.name !== fromNetwork?.name).map((n) => (
                    <div key={n.name} onClick={() => handleToNetworkChange(n)} className="px-4 py-3 hover:bg-pink-500/20 cursor-pointer flex items-center space-x-2">
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
        <div className="flex justify-center -my-2">
          <button onClick={handleSwapNetworks} className="bg-white/10 hover:bg-white/20 p-3 rounded-full shadow-lg border border-white/20 transform transition-all duration-300 hover:rotate-180 hover:scale-110 backdrop-blur-sm">
            <ArrowRightLeft size={24} className="text-purple-400" />
          </button>
        </div>
        {/* Token and Amount */}
        <div className="grid grid-cols-2 gap-4">
          {/* You send */}
          <div>
            <label className="block text-sm font-semibold mb-2">You send</label>
            <div className="relative flex items-center space-x-2">
              <button onClick={() => setShowFromTokens(!showFromTokens)} className="flex items-center px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white font-semibold">
                <span className="text-xl">{fromToken?.icon || <span className="opacity-50">●</span>}</span>
                <span className="mx-2">{fromToken?.symbol || 'Token'}</span>
                <ChevronDown size={16} />
              </button>
              {showFromTokens && (
                <div className="absolute left-0 mt-2 bg-white/10 rounded-xl shadow-lg z-10 min-w-[160px]">
                  {fromNetwork && networkTokens[fromNetwork.name].map((t) => (
                    <div key={t.symbol} onClick={() => { setFromToken(t); setShowFromTokens(false) }} className="px-4 py-3 hover:bg-purple-500/20 cursor-pointer flex items-center space-x-2">
                      <span className="text-xl">{t.icon}</span>
                      <span>{t.symbol} - {t.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-24 ml-2 px-3 py-2 bg-transparent border border-white/20 rounded-xl text-2xl font-bold text-white placeholder-white/40 outline-none"
              />
              <span className="ml-2 text-white/60 text-sm">{fromFiat}</span>
            </div>
          </div>
          {/* You receive */}
          <div>
            <label className="block text-sm font-semibold mb-2">You receive</label>
            <div className="relative flex items-center space-x-2">
              <button onClick={() => setShowToTokens(!showToTokens)} className="flex items-center px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white font-semibold">
                <span className="text-xl">{toToken?.icon || <span className="opacity-50">●</span>}</span>
                <span className="mx-2">{toToken?.symbol || 'Token'}</span>
                <ChevronDown size={16} />
              </button>
              {showToTokens && (
                <div className="absolute left-0 mt-2 bg-white/10 rounded-xl shadow-lg z-10 min-w-[160px]">
                  {toNetwork && networkTokens[toNetwork.name].map((t) => (
                    <div key={t.symbol} onClick={() => { setToToken(t); setShowToTokens(false) }} className="px-4 py-3 hover:bg-pink-500/20 cursor-pointer flex items-center space-x-2">
                      <span className="text-xl">{t.icon}</span>
                      <span>{t.symbol} - {t.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="number"
                placeholder="0.0"
                value={receiveAmount}
                readOnly
                className="w-32 ml-2 px-3 py-2 bg-transparent border border-white/20 rounded-xl text-2xl font-bold text-white/80 placeholder-white/40 outline-none"
              />
              <span className="ml-2 text-white/60 text-sm">{toFiat}</span>
            </div>
          </div>
        </div>
        {/* Summary and Confirm */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <div className="text-white/70 text-sm">Total (send + gas)</div>
            <div className="text-lg font-bold text-white">$0.00</div>
            <div className="text-xs text-white/40">Includes a 0.875% fee</div>
          </div>
          <button
            onClick={() => enqueueSnackbar('Bridge transaction initiated!', { variant: 'success' })}
            className="w-full md:w-auto px-10 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed"
            disabled={!fromNetwork || !toNetwork || !fromToken || !toToken || !amount || parseFloat(amount) <= 0}
          >
            Confirm
          </button>
        </div>
        {/* Bridge Route Card */}
        <div className="mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 space-y-4 md:space-y-0 md:space-x-6">
            {/* Protocol and Info */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                {/* Placeholder for protocol icon */}
                <span className="text-2xl">★</span>
              </div>
              <div>
                <div className="font-bold text-white text-lg">StargateV2 (Fast mode) Bridge <span className="text-xs text-white/60">via Lifi</span></div>
                <div className="flex items-center space-x-4 mt-1 text-white/70 text-sm">
                  <span>⏱ 5 mins</span>
                  <span>⛽ $5.72</span>
                </div>
              </div>
            </div>
            {/* Best Price Badge and Output */}
            <div className="flex flex-col md:flex-row items-center md:space-x-6 w-full md:w-auto justify-between">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold text-sm mb-2 md:mb-0">Best Price</span>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-white">{receiveAmount || '0.0'} {toToken?.symbol || ''}</span>
                <span className="text-white/60 text-sm">{toFiat || '$0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>

  )
}

export default BridgeInterface
