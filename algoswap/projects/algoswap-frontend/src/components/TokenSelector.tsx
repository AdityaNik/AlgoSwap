import { ChevronDown, X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { mockTokens, Token } from './Dashboard'
import { getAssetInfo } from '../utils/getAssetInfo'

type TokenSelectorProps = {
  selectedToken: Token | null
  onTokenSelect: (symbol: Token | null) => void
  show: boolean
  setShow: (show: boolean) => void
  position?: 'top' | 'bottom'
  tokens?: Token[]
}

export const TokenSelector = ({ selectedToken, onTokenSelect, show, setShow, position, tokens = [] }: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Token[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Reset search when dropdown closes
  useEffect(() => {
    if (!show) {
      setSearchQuery('')
      setSearchResults([])
    }
  }, [show])

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.id.includes(searchQuery),
  )

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Simulate API call to search for token by ID
      const token = await getAssetInfo(Number(searchQuery))
      const total = token?.assetInfo?.params?.total || '0'
      const decimals = token?.assetInfo?.params?.decimals || 0
      const actualTotal = Number(total) / 10 ** decimals

      if (token?.assetInfo?.params) {
        const searchResult: Token = {
          symbol: token.assetInfo.params.unitName || '',
          name: token.assetInfo.params.name || '',
          balance: actualTotal.toString(),
          icon: '●',
          id: searchQuery,
        }

        // Only add if not already in results
        setSearchResults((prev) => {
          const exists = prev.some((r) => r.id === searchResult.id)
          return exists ? prev : [...prev, searchResult]
        })
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle Enter key for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Combine tokens with search results, avoiding duplicates
  const allTokens = [...tokens, ...searchResults.filter((result) => !tokens.some((token) => token.id === result.id))]

  // Filter logic: if searching, show filtered results from all tokens
  const displayTokens = searchQuery
    ? allTokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.id.includes(searchQuery),
      )
    : allTokens

  return (
    <div className="relative text-right min-w-[100px] z-[60]">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center space-x-1 text-white font-semibold text-base px-2 py-1 bg-transparent hover:bg-white/10 rounded-lg transition-colors duration-200"
      >
        <span className="text-xl">{selectedToken ? tokens.find((t) => t.symbol === selectedToken.symbol)?.icon || '●' : '⟠'}</span>
        <span>{selectedToken?.name || 'Select'}</span>
        <ChevronDown size={16} className={`text-white/70 transition-transform duration-200 ${show ? 'rotate-180' : ''}`} />
      </button>

      {show && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div className="fixed inset-0 z-[60]" onClick={() => setShow(false)} />

          <div
            className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 w-80 z-[60]`}
          >
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">Select Token</h3>
                <button onClick={() => setShow(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200">
                  <X size={16} className="text-white/70" />
                </button>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search by name, symbol, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 text-sm rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-3 py-2 rounded-xl bg-purple-500/50 hover:bg-purple-500/70 border border-purple-400/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search size={16} className={`text-white ${isSearching ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {isSearching ? (
                <div className="text-center p-8 text-white/60">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mx-auto mb-2"></div>
                  Searching...
                </div>
              ) : displayTokens.length === 0 ? (
                <div className="text-center p-8 text-white/60">
                  {searchQuery ? 'No tokens found. Try searching by ID.' : 'No tokens available'}
                </div>
              ) : (
                displayTokens.map((token) => (
                  <div
                    key={token.id}
                    onClick={() => {
                      onTokenSelect(token)
                      setShow(false)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className={`flex items-center justify-between p-4 hover:bg-white/20 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedToken && token.symbol === selectedToken.symbol
                        ? 'bg-purple-500/30 border border-purple-400/60'
                        : 'hover:border-white/20 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{token.icon}</div>
                      <div>
                        <div className="font-bold text-white">{token.symbol}</div>
                        <div className="text-sm text-white/80">{token.name}</div>
                        <div className="text-xs text-white/60">ID: {token.id}</div>
                      </div>
                    </div>
                    <div className="text-sm text-white/90 font-medium">{token.balance}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
