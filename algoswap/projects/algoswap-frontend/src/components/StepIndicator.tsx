export const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, label: 'Select Pair' },
    { number: 2, label: 'Set Parameters' }
  ]

  return (
    <div className="flex justify-center space-x-6 mt-4">
      {steps.map((step, index) => (
        <div key={step.number}>
          <div className={`flex items-center ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-colors ${
                currentStep >= step.number
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                  : 'bg-gray-700'
              }`}
            >
              {step.number}
            </div>
            <span className="font-medium">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-12 h-px bg-gray-600 ml-4 mt-2"></div>
          )}
        </div>
      ))}
    </div>
  )
}
