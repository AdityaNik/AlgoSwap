import { ArrowDown } from "lucide-react"
import { Token } from "./NewPositionInterface"

export const TokenPairSelection = ({
  selectedToken1,
  selectedToken2,
  onSelectToken1,
  onSelectToken2,
  onSwapTokens
}: {
  selectedToken1: Token | null
  selectedToken2: Token | null
  onSelectToken1: () => void
  onSelectToken2: () => void
  onSwapTokens: () => void
}) => {
  return (
    <div className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 text-white">
      <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
        Select Pair
      </h2>

      <div className="space-y-4">
        {/* Token 1 Selection */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-3">Token 1</div>
          {selectedToken1 ? (
            <button
              className="flex items-center space-x-3 hover:bg-gray-700/30 p-3 rounded-lg w-full transition-colors"
              onClick={onSelectToken1}
            >
              <span className="text-2xl">{selectedToken1.icon}</span>
              <div className="text-left">
                <div className="font-medium flex items-center space-x-2">
                  <span>{selectedToken1.symbol}</span>
                  {selectedToken1.verified && <span className="text-blue-400 text-xs">✓</span>}
                </div>
                <div className="text-sm text-gray-400">{selectedToken1.name}</div>
              </div>
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-xl w-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
              onClick={onSelectToken1}
            >
              Select Token
            </button>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            className="bg-gray-700/50 backdrop-blur-sm p-3 rounded-full hover:bg-gray-600/50 transition-colors disabled:opacity-50"
            onClick={onSwapTokens}
            disabled={!selectedToken1 || !selectedToken2}
          >
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Token 2 Selection */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-3">Token 2</div>
          {selectedToken2 ? (
            <button
              className="flex items-center space-x-3 hover:bg-gray-700/30 p-3 rounded-lg w-full transition-colors"
              onClick={onSelectToken2}
            >
              <span className="text-2xl">{selectedToken2.icon}</span>
              <div className="text-left">
                <div className="font-medium flex items-center space-x-2">
                  <span>{selectedToken2.symbol}</span>
                  {selectedToken2.verified && <span className="text-blue-400 text-xs">✓</span>}
                </div>
                <div className="text-sm text-gray-400">{selectedToken2.name}</div>
              </div>
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-xl w-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
              onClick={onSelectToken2}
            >
              Select Token
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
