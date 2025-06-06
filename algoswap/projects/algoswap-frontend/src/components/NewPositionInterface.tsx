import { useState } from 'react'
import { ChevronLeft, Settings, ArrowDown, X, Search, Loader2 } from 'lucide-react'
import { StepIndicator } from './StepIndicator'
import { TokenPairSelection } from './TokenPairSelection'
import { PositionParameters } from './PositionParameter'
import { TokenSearchModal } from './TokenSearch'

// Types
export interface Token {
  id: string
  symbol: string
  name: string
  icon: string
  verified?: boolean
}

interface NewPositionInterfaceProps {
  onBack: () => void
}

const NewPositionInterface = ({ onBack }: NewPositionInterfaceProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedToken1, setSelectedToken1] = useState<Token | null>(null)
  const [selectedToken2, setSelectedToken2] = useState<Token | null>(null)
  const [selectingToken, setSelectingToken] = useState<1 | 2 | null>(null)
  const [feeTier, setFeeTier] = useState('0.30%')
  const [depositAmounts, setDepositAmounts] = useState({ token1: '', token2: '' })

  const handleSelectToken = (token: Token) => {
    if (selectingToken === 1) {
      setSelectedToken1(token)
    } else if (selectingToken === 2) {
      setSelectedToken2(token)
    }
    setSelectingToken(null)
  }

  const swapTokens = () => {
    const temp = selectedToken1
    setSelectedToken1(selectedToken2)
    setSelectedToken2(temp)
  }

  const handleNext = () => {
    if (currentStep === 1 && selectedToken1 && selectedToken2) {
      setCurrentStep(2)
    }
  }

  const handleCreate = () => {
    console.log('Creating position with:', {
      token1: selectedToken1,
      token2: selectedToken2,
      feeTier,
      depositAmounts
    })
    // Add your liquidity creation logic here
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <button
            className="flex items-center text-gray-400 hover:text-white transition-colors group"
            onClick={onBack}
          >
            <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Pools
          </button>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Create a Position
          </h1>

          <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/30 rounded-lg">
            <Settings size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 ? (
            <>
              <TokenPairSelection
                selectedToken1={selectedToken1}
                selectedToken2={selectedToken2}
                onSelectToken1={() => setSelectingToken(1)}
                onSelectToken2={() => setSelectingToken(2)}
                onSwapTokens={swapTokens}
              />

              <div className="mt-8 flex justify-end">
                <button
                  className={`px-8 py-4 rounded-xl font-medium transition-all ${
                    selectedToken1 && selectedToken2
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                      : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleNext}
                  disabled={!selectedToken1 || !selectedToken2}
                >
                  Next Step
                </button>
              </div>
            </>
          ) : (
            <>
              <PositionParameters
                selectedToken1={selectedToken1}
                selectedToken2={selectedToken2}
                feeTier={feeTier}
                setFeeTier={setFeeTier}
                depositAmounts={depositAmounts}
                setDepositAmounts={setDepositAmounts}
              />

              <div className="mt-8 flex justify-between">
                <button
                  className="px-8 py-4 bg-gray-700/50 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-gray-600/50 transition-colors"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </button>

                <button
                  onClick={handleCreate}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
                >
                  Create Position
                </button>
              </div>
            </>
          )}
        </div>

        {/* Token Search Modal */}
        <TokenSearchModal
          isOpen={selectingToken !== null}
          onClose={() => setSelectingToken(null)}
          onSelectToken={handleSelectToken}
          title={`Select ${selectingToken === 1 ? 'First' : 'Second'} Token`}
        />
      </div>
    </div>
  )
}

export default NewPositionInterface
