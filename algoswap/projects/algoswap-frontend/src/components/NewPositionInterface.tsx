import { useState, useEffect } from 'react'
import { ChevronLeft, Settings, ArrowDown, Info, X } from 'lucide-react'

const NewPositionInterface = ({ onBack }) => {
  // State for the current step (1 or 2)
  const [currentStep, setCurrentStep] = useState(1)

  // State for token selection (Step 1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedToken1, setSelectedToken1] = useState(null)
  const [selectedToken2, setSelectedToken2] = useState(null)
  const [selectingToken, setSelectingToken] = useState(null) // 1 or 2 or null

  // State for position parameters (Step 2)
  const [feeTier, setFeeTier] = useState('0.30%')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [depositAmounts, setDepositAmounts] = useState({ token1: '', token2: '' })

  // Available tokens
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', icon: '🔷', balance: '5.23', price: '$3,245.67' },
    { symbol: 'USDC', name: 'USD Coin', icon: '🔵', balance: '10,432.51', price: '$1.00' },
    { symbol: 'BTC', name: 'Bitcoin', icon: '🟠', balance: '0.35', price: '$62,456.78' },
    { symbol: 'LDO', name: 'Lido', icon: '🟢', balance: '1,245.67', price: '$2.34' },
    { symbol: 'LINK', name: 'Chainlink', icon: '🔗', balance: '532.45', price: '$12.78' },
    { symbol: 'DAI', name: 'Dai', icon: '🟡', balance: '8,752.12', price: '$1.00' },
    { symbol: 'UNI', name: 'Uniswap', icon: '🦄', balance: '425.67', price: '$9.23' },
  ]

  // Available fee tiers
  const feeTiers = [
    { value: '0.01%', description: 'Best for stable pairs' },
    { value: '0.05%', description: 'Best for stable pairs' },
    { value: '0.30%', description: 'Best for most pairs' },
    { value: '1.00%', description: 'Best for exotic pairs' },
  ]

  // Filter tokens based on search term
  const filteredTokens = tokens.filter(
    (token) => token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || token.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle token selection
  const handleSelectToken = (token) => {
    if (selectingToken === 1) {
      setSelectedToken1(token)
    } else {
      setSelectedToken2(token)
    }
    setSelectingToken(null)
  }

  // Function to swap tokens
  const swapTokens = () => {
    const temp = selectedToken1
    setSelectedToken1(selectedToken2)
    setSelectedToken2(temp)
  }

  // Handle advancing to the next step
  const handleNext = () => {
    if (currentStep === 1 && selectedToken1 && selectedToken2) {
      setCurrentStep(2)
    }
  }

  // Token Selection Modal
  const TokenSelectionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Select a token</h3>
          <button onClick={() => setSelectingToken(null)} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or paste address"
            className="w-full bg-gray-700 text-white p-3 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredTokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg cursor-pointer"
              onClick={() => handleSelectToken(token)}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{token.icon}</span>
                <div>
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-sm text-gray-400">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div>{token.balance}</div>
                <div className="text-sm text-gray-400">{token.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Step 1: Token Selection
  const renderStep1 = () => (
    <div className="mt-6">
      <div className="bg-transparant border-white border-2 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Select Pair</h2>

        <div className="space-y-4">
          {/* Token 1 Selection */}
          <div className="bg-transparant rounded-lg p-4 border-white border-2">
            <div className="text-sm text-gray-400 mb-2">Token 1</div>
            {selectedToken1 ? (
              <button className="flex items-center space-x-2 hover:bg-gray-900 p-2 rounded-lg w-full" onClick={() => setSelectingToken(1)}>
                <span className="text-2xl">{selectedToken1.icon}</span>
                <span className="font-medium">{selectedToken1.symbol}</span>
                <span className="ml-auto text-gray-400">Balance: {selectedToken1.balance}</span>
              </button>
            ) : (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full" onClick={() => setSelectingToken(1)}>
                Select Token
              </button>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button className="bg-gray-700 p-2 rounded-full" onClick={swapTokens} disabled={!selectedToken1 || !selectedToken2}>
              <ArrowDown size={20} />
            </button>
          </div>

          {/* Token 2 Selection */}
          <div className="bg-transparant border-white border-2 rounded-lg p-4 text-white">
            <div className="text-sm text-gray-400 mb-2">Token 2</div>
            {selectedToken2 ? (
              <button className="flex items-center space-x-2 hover:bg-gray-600 p-2 rounded-lg w-full" onClick={() => setSelectingToken(2)}>
                <span className="text-2xl">{selectedToken2.icon}</span>
                <span className="font-medium">{selectedToken2.symbol}</span>
                <span className="ml-auto text-gray-400">Balance: {selectedToken2.balance}</span>
              </button>
            ) : (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full" onClick={() => setSelectingToken(2)}>
                Select Token
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className={`px-6 py-3 rounded-lg font-medium ${
            selectedToken1 && selectedToken2
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleNext}
          disabled={!selectedToken1 || !selectedToken2}
        >
          Next Step
        </button>
      </div>
    </div>
  )

  // Step 2: Set Position Parameters
  const renderStep2 = () => (
    <div className="my-6">
      <div className="bg-transparent text-white border-white border-2 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Set Position Parameters</h2>

        {/* Selected pair display */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <span className="text-2xl">{selectedToken1.icon}</span>
            <span className="mx-1 font-medium">{selectedToken1.symbol}</span>
          </div>
          <span className="mx-2">/</span>
          <div className="flex items-center">
            <span className="text-2xl">{selectedToken2.icon}</span>
            <span className="mx-1 font-medium">{selectedToken2.symbol}</span>
          </div>
        </div>

        {/* Fee Tier Selection */}
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Fee Tier</label>
          <div className="grid grid-cols-2 gap-2">
            {feeTiers.map((tier) => (
              <button
                key={tier.value}
                className={`p-3 rounded-lg border ${
                  feeTier === tier.value ? 'border-purple-500 bg-gray-700' : 'border-gray-600 bg-gray-800'
                }`}
                onClick={() => setFeeTier(tier.value)}
              >
                <div className="font-medium">{tier.value}</div>
                <div className="text-sm text-gray-400">{tier.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <label className="text-gray-400">Price Range</label>
            <button className="text-blue-400 flex items-center text-sm">
              <Info size={14} className="mr-1" />
              Full Range
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min Price</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                placeholder="0.00"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
              <div className="text-sm text-gray-400 mt-1">
                {selectedToken2?.symbol} per {selectedToken1?.symbol}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Price</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
                placeholder="∞"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
              <div className="text-sm text-gray-400 mt-1">
                {selectedToken2?.symbol} per {selectedToken1?.symbol}
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Amounts */}
        <div>
          <label className="block text-gray-400 mb-2">Deposit Amounts</label>
          <div className="space-y-3">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-sm text-gray-400">Balance: {selectedToken1?.balance}</span>
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  className="flex-grow bg-transparent outline-none"
                  placeholder="0.0"
                  value={depositAmounts.token1}
                  onChange={(e) => setDepositAmounts({ ...depositAmounts, token1: e.target.value })}
                />
                <div className="flex items-center">
                  <span className="text-xl mr-2">{selectedToken1?.icon}</span>
                  <span>{selectedToken1?.symbol}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-sm text-gray-400">Balance: {selectedToken2?.balance}</span>
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  className="flex-grow bg-transparent outline-none"
                  placeholder="0.0"
                  value={depositAmounts.token2}
                  onChange={(e) => setDepositAmounts({ ...depositAmounts, token2: e.target.value })}
                />
                <div className="flex items-center">
                  <span className="text-xl mr-2">{selectedToken2?.icon}</span>
                  <span>{selectedToken2?.symbol}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <button className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium" onClick={() => setCurrentStep(1)}>
          Back
        </button>

        <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium">Preview</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button className="flex items-center text-gray-400 hover:text-white" onClick={onBack}>
          <ChevronLeft size={20} className="mr-1" />
          Back to Pools
        </button>

        <h1 className="text-xl font-bold">Create a Position</h1>

        <button className="text-gray-400 hover:text-white">
          <Settings size={20} />
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex justify-center space-x-4 mt-4">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep >= 1 ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            1
          </div>
          <span>Select Pair</span>
        </div>

        <div className="w-8 h-px bg-gray-600 self-center"></div>

        <div className={`flex items-center ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            2
          </div>
          <span>Set Parameters</span>
        </div>
      </div>

      {/* Current step content */}
      {currentStep === 1 ? renderStep1() : renderStep2()}

      {/* Token selection modal */}
      {selectingToken && <TokenSelectionModal />}
    </div>
  )
}

export default NewPositionInterface
