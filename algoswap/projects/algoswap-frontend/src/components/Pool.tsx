// Import needed components
import { Search, Plus, Droplets, TrendingUp, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import NewPositionInterface from './NewPositionInterface' // Import the new component
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from './ConnectWallet'
import { getAppClient } from './GetAppClient'
import { enqueueSnackbar } from 'notistack'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { AlgodClient } from 'algosdk/dist/types/client/v2/algod/algod'
import algosdk from 'algosdk'
import { useWalletUI } from '../context/WalletContext'
import axios from 'axios'

const LiquidityPoolInterface = () => {
  const { openWalletModal, toggleWalletModal } = useWalletUI();

  const [currentView, setCurrentView] = useState('pools') // 'pools' or 'newPosition'
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { activeAddress, transactionSigner } = useWallet()
  type Pool = {
    id: number | string
    name: string
    feeTier: string | number
    tvl?: number
    liquidity: string | number
  }

  const [pools, setPool] = useState<Pool[]>([])

  // Get asset info using asset IDs


  // Main function to fetch all data
  const fetchAllData = async () => {
    const res = await axios.get('http://localhost:3000/pools');
    console.log(res.data);
    setPool(res.data);
    setLoading(false);
  }

  // Run the data fetch once when component mounts
  useEffect(() => {
    fetchAllData()
  }, [activeAddress]) // Re-run when activeAddress changes

  // Handle returning from new position view
  const handleBackToPoolList = () => {
    setCurrentView('pools')
  }

  // Conditionally render the current view
  if (currentView === 'newPosition') {
    return (
      <div className="">
        <NewPositionInterface onBack={handleBackToPoolList} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-spin">
              <Droplets size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Loading Pools</h2>
              <p className="text-white/70">Fetching liquidity data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <Droplets size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Liquidity Pools
            </h1>
          </div>
          <p className="text-white/70 text-lg">Manage your liquidity positions and earn fees</p>
        </div>

        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-white/50" />
            </div>
            <input
              type="text"
              placeholder="Search pools..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button className="flex items-center space-x-2 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all duration-200">
              <Filter size={18} />
              <span className="font-medium">Filter</span>
            </button>
            <button
              className="flex items-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => setCurrentView('newPosition')}
            >
              <Plus size={18} />
              <span>Create Pool</span>
            </button>
          </div>
        </div>

        {/* Pools table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="bg-white/5 border-b border-white/10">
            <div className="grid grid-cols-6 gap-4 py-6 px-8 text-sm font-semibold text-white/80">
              <div>#</div>
              <div>Pool</div>
              <div>Fee Tier</div>
              <div>TVL</div>
              <div>Pool Liquidity</div>
              <div>Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/10">
            {pools.length > 0 ? (
              pools.map((pool) => (
                <div key={pool.id} className="grid grid-cols-6 gap-4 py-6 px-8 hover:bg-white/5 transition-all duration-200 group">
                  <div className="flex items-center text-white font-medium">
                    {pool.id}
                  </div>

                  <div className="flex items-center">
                    {/* <div className="flex -space-x-2 mr-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20">
                        {pool.icon1}
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20">
                        {pool.icon2}
                      </div>
                    </div> */}
                    <span className="text-white font-semibold">{pool.name}</span>
                  </div>

                  <div className="flex items-center text-white font-medium">
                    {pool.feeTier}
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center space-x-1">
                      <TrendingUp size={16} className="text-green-400" />
                      <span className="text-white font-semibold">${pool.tvl?.toLocaleString() || '0'}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-white font-medium">
                    {pool.liquidity}
                  </div>

                  <div className="flex items-center">
                    <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group-hover:scale-110">
                      Add Liquidity
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Droplets size={32} className="text-white/50" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Pools Available</h3>
                <p className="text-white/60 mb-8">No pools found or still loading data...</p>
                <button
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => setCurrentView('newPosition')}
                >
                  <Plus size={18} />
                  <span>Create First Pool</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <Droplets size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Total Pools</h3>
                <p className="text-2xl font-bold text-white">{pools.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-500/30 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Total TVL</h3>
                <p className="text-2xl font-bold text-white">
                  ${pools.reduce((sum, pool) => sum + (pool.tvl || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-pink-500/30 rounded-xl flex items-center justify-center">
                <Plus size={20} className="text-pink-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Active Positions</h3>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/60 text-sm font-medium">
          💧 Manage your liquidity positions and earn trading fees
        </div>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default LiquidityPoolInterface
