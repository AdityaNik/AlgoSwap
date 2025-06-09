import { Token } from "./NewPositionInterface"

export const PositionParameters = ({
  selectedToken1,
  selectedToken2,
  feeTier,
  setFeeTier,
  depositAmounts,
  setDepositAmounts
}: {
  selectedToken1: Token | null
  selectedToken2: Token | null
  feeTier: Number
  setFeeTier: any
  depositAmounts: { token1: string; token2: string }
  setDepositAmounts: (amounts: { token1: string; token2: string }) => void
}) => {
  const feeTiers = [
    { value: 0.005, description: 'Best for stable pairs' },
    { value: 0.003, description: 'Best for most pairs' },
    { value: 0.01, description: 'Best for exotic pairs' }
  ]

  return (
    <div className="bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 text-white">
      <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
        Set Position Parameters
      </h2>

      {/* Selected pair display */}
      <div className="flex items-center justify-center mb-8 bg-gray-800/40 backdrop-blur-sm rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{selectedToken1?.icon}</span>
          <span className="font-medium">{selectedToken1?.symbol}</span>
        </div>
        <span className="mx-3 text-gray-400">/</span>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{selectedToken2?.icon}</span>
          <span className="font-medium">{selectedToken2?.symbol}</span>
        </div>
      </div>

      {/* Fee Tier Selection */}
      <div className="mb-8">
        <label className="block text-gray-400 mb-4 font-medium">Fee Tier</label>
        <div className="grid grid-cols-1 gap-3">
          {feeTiers.map((tier) => (
            <button
              key={tier.value}
              className={`p-4 rounded-xl border transition-all ${
                feeTier === tier.value
                  ? 'border-purple-500/50 bg-gray-700/50 backdrop-blur-sm'
                  : 'border-gray-600/30 bg-gray-800/30 hover:bg-gray-700/30'
              }`}
              onClick={() => setFeeTier(tier.value)}
            >
              <div className="font-medium text-lg">{tier.value}</div>
              <div className="text-sm text-gray-400">{tier.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Amounts */}
      <div>
        <label className="block text-gray-400 mb-4 font-medium">Add Initial Liquidity</label>
        <div className="space-y-4">
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Amount</span>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                className="flex-grow bg-transparent outline-none text-lg placeholder-gray-500"
                placeholder="0.0"
                value={depositAmounts.token1}
                onChange={(e) => setDepositAmounts({ ...depositAmounts, token1: e.target.value })}
              />
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-xl">{selectedToken1?.icon}</span>
                <span className="font-medium">{selectedToken1?.symbol}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Amount</span>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                className="flex-grow bg-transparent outline-none text-lg placeholder-gray-500"
                placeholder="0.0"
                value={depositAmounts.token2}
                onChange={(e) => setDepositAmounts({ ...depositAmounts, token2: e.target.value })}
              />
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-xl">{selectedToken2?.icon}</span>
                <span className="font-medium">{selectedToken2?.symbol}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
