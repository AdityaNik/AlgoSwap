// Import needed components
import { Search as SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import NewPositionInterface from './NewPositionInterface' // Import the new component
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from './ConnectWallet'
import { getAppClient } from './GetAppClient'
import { enqueueSnackbar } from 'notistack'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { AlgodClient } from 'algosdk/dist/types/client/v2/algod/algod'
import algosdk from 'algosdk'

interface ConnectWalletInterface {
  openWalletModal: boolean
  toggleWalletModal: () => void
}

const LiquidityPoolInterface = ({ openWalletModal, toggleWalletModal }: ConnectWalletInterface) => {
  const [currentView, setCurrentView] = useState('pools') // 'pools' or 'newPosition'
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { activeAddress, transactionSigner } = useWallet()
  const [poolInfo, setPoolInfo] = useState<[bigint, bigint, bigint, bigint, bigint] | undefined>(undefined)
  const [assetAInfo, setAssetAInfo] = useState<{ name: string; unitName: string; decimals: number }>({
    name: '',
    unitName: '',
    decimals: 0,
  })
  const [assetBInfo, setAssetBInfo] = useState<{ name: string; unitName: string; decimals: number }>({
    name: '',
    unitName: '',
    decimals: 0,
  })
  const [pools, setPool] = useState<
    { id: number; name: string; protocol: string; feeTier: string; tvl: number; liquidity: string; icon1: string; icon2: string }[]
  >([])

  // Get pool info from smart contract
  const getPoolInfo = async () => {
    try {
      if (!activeAddress) {
        enqueueSnackbar('Active address is required', { variant: 'error' })
        return undefined
      }

      const appClient = await getAppClient(activeAddress, transactionSigner)
      if (!appClient) {
        return undefined
      }

      // Call the getPoolInfo function on the contract
      const response = await appClient.send.getPoolInfo({
        extraFee: AlgoAmount.Algos(0.1),
        args: [],
      })

      if (!response) {
        return undefined
      }

      enqueueSnackbar(`Pool info retrieved successfully`, { variant: 'success' })
      console.log('Pool info response:', response.return)
      return response.return
    } catch (error) {
      enqueueSnackbar(`Error getting pool info: ${error.message}`, { variant: 'error' })
      return undefined
    }
  }

  // Get asset info using asset IDs
  const getAssetInfo = async (assetAId: bigint, assetBId: bigint) => {
    try {
      console.log('Getting asset info for IDs:', assetAId.toString(), assetBId.toString())

      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

      // Get asset A info
      const assetA = await algodClient.getAssetByID(assetAId).do()
      const assetADetails = {
        name: assetA.params.name || 'Unknown Asset',
        unitName: assetA.params.unitName || 'Unknown Asset',
        decimals: assetA.params.decimals,
      }
      console.log('Asset A Info:', assetADetails)
      setAssetAInfo(assetADetails)

      // Get asset B info
      const assetB = await algodClient.getAssetByID(assetBId).do()
      const assetBDetails = {
        name: assetB.params.name || 'Unknown Asset',
        unitName: assetB.params.unitName || 'Unknown Asset',
        decimals: assetB.params.decimals,
      }
      console.log('Asset B Info:', assetBDetails)
      setAssetBInfo(assetBDetails)

      return { assetA: assetADetails, assetB: assetBDetails }
    } catch (error) {
      enqueueSnackbar(`Error getting asset info: ${error.message}`, { variant: 'error' })
      return undefined
    }
  }

  // Update pools data with asset info
  const updatePoolsData = (poolInfoData: [bigint, bigint, bigint, bigint, bigint], assetADetails, assetBDetails) => {
    const poolsData = [
      {
        id: 1,
        name: `${assetADetails.unitName} / ${assetBDetails.unitName}`,
        protocol: 'v3',
        feeTier: '0.30%',
        tvl: Number(poolInfoData[2]) * Number(poolInfoData[3]),
        icon1: '🔷',
        icon2: '🔵',
        liquidity: `${poolInfoData[2].toString()} ${assetADetails.unitName} / ${poolInfoData[3].toString()} ${assetBDetails.unitName}`,
      },
    ]

    console.log('Updated pool data:', poolsData)
    setPool(poolsData)
  }

  // Main function to fetch all data
  const fetchAllData = async () => {
    setLoading(true)

    try {
      // Step 1: Get pool info
      const poolInfoData = await getPoolInfo()

      if (!poolInfoData) {
        setLoading(false)
        return
      }

      // Store pool info in state
      setPoolInfo(poolInfoData)

      // Step 2: Get asset info using asset IDs from pool info
      const assetAId = poolInfoData[0]
      const assetBId = poolInfoData[1]

      const assetDetails = await getAssetInfo(assetAId, assetBId)

      if (assetDetails) {
        // Step 3: Update pools data with all the information
        updatePoolsData(poolInfoData, assetDetails.assetA, assetDetails.assetB)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      enqueueSnackbar(`Error loading data: ${error.message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Run the data fetch once when component mounts
  useEffect(() => {
    fetchAllData()

    // Set up periodic refresh every 10 seconds
    // const intervalId = setInterval(fetchAllData, 10000)

    // Clean up the interval when component unmounts
    // return () => clearInterval(intervalId)
  }, [activeAddress]) // Re-run when activeAddress changes

  // Handle returning from new position view
  const handleBackToPoolList = () => {
    setCurrentView('pools')
  }

  // Conditionally render the current view
  if (currentView === 'newPosition') {
    return (
      <div className="h-screen">
        <NewPositionInterface onBack={handleBackToPoolList} />
      </div>
    )
  }

  if (loading) {
    return <div className="h-screen flex flex-col items-center justify-center text-white">Fetching pools...</div>
  }

  return (
    <div className="mt-10 min-h-screen">
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
            + Create A Pool
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
              <th className="py-4 px-6 text-gray-400">Pool Liquidity</th>
              <th className="py-4 px-6 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pools.length > 0 ? (
              pools.map((pool) => (
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
                  <td className="py-4 px-6 text-white">{pool.liquidity}</td>
                  <td className="py-4 px-6">
                    <button className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md text-sm hover:opacity-90 transition-all">
                      Add
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-gray-700">
                <td colSpan={7} className="py-4 px-6 text-white text-center">
                  No pools available or waiting for data...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default LiquidityPoolInterface
