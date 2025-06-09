import { useState, useEffect } from 'react'
import { X, Plus, ArrowDown, Droplets, TrendingUp, AlertCircle, Settings } from 'lucide-react'
import axios from 'axios'

type AddLiquidityDialogProps = {
  isOpen: boolean
  onClose: () => void
  pool: any
  activeAddress: string | null
  transactionSigner: any
  getAppClient: any
  enqueueSnackbar: (message: string, options?: { variant: string }) => void
  fetchAllData: () => Promise<void>
}

const AddLiquidityDialog = ({
  isOpen,
  onClose,
  pool,
  activeAddress,
  transactionSigner,
  getAppClient,
  enqueueSnackbar,
  fetchAllData,
}: AddLiquidityDialogProps) => {
  const [token0Amount, setToken0Amount] = useState('')
  const [token1Amount, setToken1Amount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [priceImpact, setPriceImpact] = useState(0)
  const [estimatedShare, setEstimatedShare] = useState(0)

  // Mock token data - replace with actual token data from your pool
  const token0 = {
    symbol: pool?.name?.split('/')[0] || 'TOKEN0',
    balance: '1,234.56',
    icon: '🪙',
  }

  const token1 = {
    symbol: pool?.name?.split('/')[1] || 'TOKEN1',
    balance: '9,876.54',
    icon: '💎',
  }

  // Calculate token1 amount based on token0 input (simplified)
  const handleToken0Change = (value: any) => {
    setToken0Amount(value)
    if (value && !isNaN(value)) {
      // Mock calculation - replace with actual pool ratio calculation
      const ratio = 1.2 // This should come from pool data
      setToken1Amount((parseFloat(value) * ratio).toFixed(6))
      setPriceImpact(Math.random() * 0.5) // Mock price impact
      setEstimatedShare(Math.random() * 10) // Mock pool share
    } else {
      setToken1Amount('')
      setPriceImpact(0)
      setEstimatedShare(0)
    }
  }

  const handleToken1Change = (value: any) => {
    setToken1Amount(value)
    if (value && !isNaN(value)) {
      // Mock calculation - replace with actual pool ratio calculation
      const ratio = 0.8 // This should come from pool data
      setToken0Amount((parseFloat(value) * ratio).toFixed(6))
      setPriceImpact(Math.random() * 0.5)
      setEstimatedShare(Math.random() * 10)
    } else {
      setToken0Amount('')
      setPriceImpact(0)
      setEstimatedShare(0)
    }
  }

  const handleAddLiquidity = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'error' })
      return
    }

    if (!token0Amount || !token1Amount) {
      enqueueSnackbar('Please enter amounts for both tokens', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      // Add your liquidity logic here
      // This is where you'd integrate with your smart contract
      console.log('Adding liquidity:', { token0Amount, token1Amount, pool })

      // Get current pool data
      const res1 = await axios.get('http://localhost:3000/pools', {
        params: { id: pool?._id },
      })

      const currentPool = res1.data.find((p: any) => p._id === pool?._id)

      if (!currentPool) {
        throw new Error('Pool not found')
      }

      console.log('Current Pool:', currentPool)

      // Calculate new liquidity and TVL
      // Convert string amounts to numbers for calculation
      const newToken0Amount = parseFloat(token0Amount) || 0
      const newToken1Amount = parseFloat(token1Amount) || 0

      // Calculate the new liquidity (you might want to adjust this calculation based on your specific formula)
      // This is a simple addition - you may need a more complex formula
      const currentLiquidity = parseInt(currentPool.liquidity) || 0
      const currentTvl = parseInt(currentPool.tvl) || 0

      // Simple liquidity calculation (square root of product)
      const addedLiquidity = Math.sqrt(newToken0Amount * newToken1Amount)
      const newLiquidity = currentLiquidity + addedLiquidity

      // Calculate new TVL (assuming token prices or add your price calculation)
      // For now, using a simple addition - you should implement proper price calculation
      const newTvl = currentTvl + newToken0Amount + newToken1Amount

      console.log('Calculated values:', {
        currentLiquidity,
        addedLiquidity,
        newLiquidity,
        currentTvl,
        newTvl,
      })

      // Update the pool with new values
      const updateRes = await axios.post('http://localhost:3000/updatePool', {
        id: pool?._id,
        tvl: Math.round(newTvl), // Round to avoid decimals if needed
        liquidity: Math.round(newLiquidity).toString(), // Convert back to string to match your format
        reserveA: newToken0Amount,
        reserveB: newToken1Amount
      })
      console.log('Update Response:', updateRes.data)
      // Mock transaction

      await new Promise((resolve) => setTimeout(resolve, 2000))
      fetchAllData()
      enqueueSnackbar('Liquidity added successfully!', { variant: 'success' })
      onClose()
      setToken0Amount('')
      setToken1Amount('')
    } catch (error) {
      console.error('Error adding liquidity:', error)
      enqueueSnackbar('Failed to add liquidity', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const setMaxToken0 = () => {
    handleToken0Change(token0.balance.replace(',', ''))
  }

  const setMaxToken1 = () => {
    handleToken1Change(token1.balance.replace(',', ''))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-3xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <Droplets size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Add Liquidity</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <Settings size={18} className="text-white/70" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={18} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 border-b border-white/10 bg-white/5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Slippage Tolerance</label>
                <div className="flex space-x-2">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        slippage === value ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="text"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="w-16 px-2 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm text-center"
                    placeholder="0.5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Pool Info */}
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Pool</span>
              <span className="text-white/70 text-sm">Fee: {pool?.feeTier}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-semibold">{pool?.name}</span>
            </div>
          </div>

          {/* Token 0 Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">First Token</span>
              <span className="text-white/70 text-sm">Balance: {token0.balance}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 focus-within:border-purple-400 transition-colors">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={token0Amount}
                  onChange={(e) => handleToken0Change(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-white text-xl font-semibold placeholder-white/30 outline-none flex-1"
                />
                <div className="flex items-center space-x-3">
                  <button
                    onClick={setMaxToken0}
                    className="px-2 py-1 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-purple-300 text-xs font-medium transition-colors"
                  >
                    MAX
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{token0.icon}</span>
                    <span className="text-white font-semibold">{token0.symbol}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Plus size={20} className="text-white/70" />
            </div>
          </div>

          {/* Token 1 Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Second Token</span>
              <span className="text-white/70 text-sm">Balance: {token1.balance}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 focus-within:border-purple-400 transition-colors">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={token1Amount}
                  onChange={(e) => handleToken1Change(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-white text-xl font-semibold placeholder-white/30 outline-none flex-1"
                />
                <div className="flex items-center space-x-3">
                  <button
                    onClick={setMaxToken1}
                    className="px-2 py-1 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-purple-300 text-xs font-medium transition-colors"
                  >
                    MAX
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{token1.icon}</span>
                    <span className="text-white font-semibold">{token1.symbol}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {token0Amount && token1Amount && (
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Price Impact</span>
                  <span className={`${priceImpact > 1 ? 'text-red-400' : 'text-green-400'} font-medium`}>{priceImpact.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Pool Share</span>
                  <span className="text-white font-medium">{estimatedShare.toFixed(4)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Slippage Tolerance</span>
                  <span className="text-white font-medium">{slippage}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Price Impact Warning */}
          {priceImpact > 1 && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-red-400 text-sm font-medium">High Price Impact</span>
              </div>
              <p className="text-red-300 text-xs mt-1">This transaction will significantly impact the pool price.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!activeAddress ? (
              <button className="w-full py-4 bg-purple-500 hover:bg-purple-600 rounded-2xl text-white font-semibold transition-colors">
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={handleAddLiquidity}
                disabled={loading || !token0Amount || !token1Amount}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-500 disabled:cursor-not-allowed rounded-2xl text-white font-semibold transition-all duration-300 hover:shadow-lg"
              >
                {loading ? 'Adding Liquidity...' : 'Add Liquidity'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityDialog
