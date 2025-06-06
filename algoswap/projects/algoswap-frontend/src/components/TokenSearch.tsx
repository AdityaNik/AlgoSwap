import { useState } from "react"
import { Token } from "./NewPositionInterface"
import { Loader2, Search, X } from "lucide-react"
import { getAssetInfo } from "../utils/getAssetInfo"

export const TokenSearchModal = ({
  isOpen,
  onClose,
  onSelectToken,
  title = "Select a token"
}: {
  isOpen: boolean
  onClose: () => void
  onSelectToken: (token: Token) => void
  title?: string
}) => {
  const [searchId, setSearchId] = useState('')
  const [foundToken, setFoundToken] = useState<Token | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setSearchError('Please enter a token ID')
      return
    }

    setIsSearching(true)
    setSearchError('')
    setFoundToken(null)

    try {
      const result = await getAssetInfo(Number(searchId.trim()))
      if (result && result.assetInfo) {
        const assetInfo = result.assetInfo
        // Map assetInfo to Token type as needed
        const token: Token = {
          id: assetInfo.index?.toString() || '',
          symbol: assetInfo.params.unitName || '',
          name: assetInfo.params.name || '',
          icon: '💰', // You may want to map or fetch the correct icon
          verified: true,
        }
        setFoundToken(token)
        console.log('Asset Info:', assetInfo)
      } else {
        setSearchError('Token not found')
      }
    } catch (error) {
      setSearchError('Error searching for token')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectToken = (token: Token) => {
    onSelectToken(token)
    setSearchId('')
    setFoundToken(null)
    setSearchError('')
    onClose()
  }

  const handleClose = () => {
    setSearchId('')
    setFoundToken(null)
    setSearchError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter token ID (e.g., 312769)"
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 text-white p-4 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>

          {searchError && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-lg p-3">
              {searchError}
            </div>
          )}

          {foundToken && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-4">
              <div
                className="flex items-center justify-between p-3 hover:bg-gray-700/30 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleSelectToken(foundToken)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{foundToken.icon}</span>
                  <div>
                    <div className="font-medium flex items-center space-x-2">
                      <span>{foundToken.symbol}</span>
                      {foundToken.verified && <span className="text-blue-400 text-xs">✓</span>}
                    </div>
                    <div className="text-sm text-gray-400">{foundToken.name}</div>
                    <div className="text-xs text-gray-500">ID: {foundToken.id}</div>
                  </div>
                </div>
                <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Select
                </button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            Popular IDs: 312769 (USDC), 31566704 (USDT), 27165954 (PLANET)
          </div>
        </div>
      </div>
    </div>
  )
}
