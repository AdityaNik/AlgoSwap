import { Info } from "lucide-react"
import { Token } from "./Dashboard"

type PriceInfoProps = {
  fromToken: Token | null
  toToken: Token | null
  fromAmount: string
  liquiditySource: string
  assetAInfo: any
  assetBInfo: any
}

export const PriceInfo = ({ fromToken, toToken, fromAmount, liquiditySource, assetAInfo, assetBInfo }: PriceInfoProps) => {
  const getExchangeRate = () => {
    if (assetAInfo && assetBInfo) {
      const fromReserve = Number(assetAInfo.reserveA)
      const toReserve = Number(assetBInfo.reserveB)
      const amount = parseFloat(fromAmount)

      const FEE_NUM = 997
      const FEE_DEN = 1000

      const amountInWithFee = (amount * FEE_NUM) / FEE_DEN
      const numerator = amountInWithFee * toReserve
      const denominator = fromReserve + amountInWithFee
      const amountOut = numerator / denominator

      return amountOut
    }
    return 1
  }

  if (!fromAmount || parseFloat(fromAmount) <= 0) return null

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 space-y-3 border border-white/10">
      <div className="flex justify-between text-sm">
        <span className="text-white/70">Price</span>
        <span className="font-semibold text-white">
          1 {fromToken?.balance} = {getExchangeRate().toFixed(6)} {toToken?.symbol}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-white/70">Estimated Gas</span>
        <span className="font-semibold text-white">~0.004 ALGO</span>
      </div>
      <div className="flex justify-between text-sm items-center">
        <span className="text-white/70">Route</span>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white">{fromToken?.symbol ?? ''}</span>
          <div className="w-4 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded"></div>
          <span className="font-semibold text-white">{toToken?.symbol ?? ''}</span>
          <Info size={14} className="text-white/50" />
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-white/70">Source</span>
        <span className="font-semibold text-purple-400">{liquiditySource}</span>
      </div>
    </div>
  )
}
