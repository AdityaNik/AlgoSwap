// Don't forget to add this import at the top
import { Search as SearchIcon } from 'lucide-react'
import { useState } from 'react'

// Update the initial state to include selectedToken1 and selectedToken2

const LiquidityPoolInterface = () => {
  // Add state for search term, filtering, and sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('tvl')
  const [sortDirection, setSortDirection] = useState('desc')

  // Expanded pool data with more details
  // Define the initial pools data
  const pools = [
    {
      id: 1,
      name: 'ETH/USDC',
      protocol: 'v3',
      feeTier: '0.30%',
      tvl: '$120.5M',
      apr: '8.23%',
      icon1: '🔷',
      icon2: '🔵',
      volume24h: '$10.2M',
      liquidity: '50K ETH / 100M USDC',
    },
    {
      id: 2,
      name: 'BTC/ETH',
      protocol: 'v3',
      feeTier: '0.05%',
      tvl: '$95.3M',
      apr: '6.78%',
      icon1: '🟠',
      icon2: '🔷',
      volume24h: '$8.7M',
      liquidity: '2.1K BTC / 30K ETH',
    },
  ]

  const [expandedPoolList, setExpandedPoolList] = useState([
    ...pools,
    {
      id: 7,
      name: 'LDO/ETH',
      protocol: 'v3',
      feeTier: '0.30%',
      tvl: '$56.2M',
      apr: '11.45%',
      icon1: '🟢',
      icon2: '🔷',
      volume24h: '$3.2M',
      liquidity: '15.43K ETH / 278.6K LDO',
    },
    {
      id: 8,
      name: 'LINK/ETH',
      protocol: 'v4',
      feeTier: '0.05%',
      tvl: '$48.7M',
      apr: '7.89%',
      icon1: '🔗',
      icon2: '🔷',
      volume24h: '$952K',
      liquidity: '12.1K ETH / 432.8K LINK',
    },
    {
      id: 9,
      name: 'DAI/USDC',
      protocol: 'v4',
      feeTier: '0.01%',
      tvl: '$36.9M',
      apr: '2.34%',
      icon1: '🟠',
      icon2: '🔵',
      volume24h: '$5.3M',
      liquidity: '18.4M DAI / 18.5M USDC',
    },
    {
      id: 10,
      name: 'UNI/ETH',
      protocol: 'v3',
      feeTier: '0.30%',
      tvl: '$30.1M',
      apr: '12.7%',
      icon1: '🦄',
      icon2: '🔷',
      volume24h: '$1.7M',
      liquidity: '7.5K ETH / 321.4K UNI',
    },
  ])

  // Filter and sort pools based on user selection
  const filteredPools = expandedPoolList
    .filter((pool) => {
      // Apply search filter
      if (searchTerm && !pool.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      // Apply protocol filter
      if (activeFilter !== 'all' && pool.protocol !== activeFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      // Extract numeric values for sorting
      const getNumericValue = (pool, field) => {
        if (field === 'tvl') {
          return parseFloat(pool.tvl.replace('$', '').replace('M', ''))
        } else if (field === 'apr') {
          return parseFloat(pool.apr.replace('%', ''))
        } else {
          return pool[field]
        }
      }

      const aValue = getNumericValue(a, sortBy)
      const bValue = getNumericValue(b, sortBy)

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

  return (
    <div className="mt-10 h-screen">
      {/* Search and filter controls */}
      <div className="flex justify-between gap-4 mb-6 mx-20">
        <div className="bg-transparent rounded-lg flex items-center">
          <SearchIcon size={20} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search pools..."
            className="bg-transparent text-white w-full outline-none border-gray-500 border-2 rounded-lg px-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all"
            onClick={() => setCurrentView('newPosition')}
          >
            + New Position
          </button>
        </div>
      </div>

      {/* Pools table */}
      <div className="bg-transparent border-gray-400 border-2 rounded-xl overflow-hidden mx-20">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-4 px-6 text-gray-400">#</th>
              <th className="py-4 px-6 text-gray-400">Pool</th>
              <th className="py-4 px-6 text-gray-400">Protocol</th>
              <th className="py-4 px-6 text-gray-400">Fee tier</th>
              <th className="py-4 px-6 text-gray-400">TVL</th>
              <th className="py-4 px-6 text-gray-400">Pool APR</th>
              <th className="py-4 px-6 text-gray-400">Volume (24h)</th>
              <th className="py-4 px-6 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPools.map((pool) => (
              <tr key={pool.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                <td className="py-4 px-6 text-white">{pool.id}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-2">
                      <span className="text-xl">{pool.icon1}</span>
                      <span className="text-xl">{pool.icon2}</span>
                    </div>
                    <span className="text-white">{pool.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      pool.protocol === 'v4'
                        ? 'bg-purple-600 text-white'
                        : pool.protocol === 'v3'
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-600 text-white'
                    }`}
                  >
                    {pool.protocol}
                  </span>
                </td>
                <td className="py-4 px-6 text-white">{pool.feeTier}</td>
                <td className="py-4 px-6 text-white">{pool.tvl}</td>
                <td className="py-4 px-6 text-white">{pool.apr}</td>
                <td className="py-4 px-6 text-white">{pool.volume24h || '—'}</td>
                <td className="py-4 px-6">
                  <button className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md text-sm hover:opacity-90 transition-all">
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LiquidityPoolInterface
