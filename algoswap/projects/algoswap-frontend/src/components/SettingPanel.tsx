import { Zap } from "lucide-react";

type SettingsPanelProps = {
  showSettings: boolean;
  slippage: number;
  setSlippage: (value: number) => void;
  txnSpeed: string;
  setTxnSpeed: (value: string) => void;
  gasPrice: number;
  setGasPrice: (value: number) => void;
};

export const SettingsPanel = ({
  showSettings,
  slippage,
  setSlippage,
  txnSpeed,
  setTxnSpeed,
  gasPrice,
  setGasPrice
}: SettingsPanelProps) => {
  if (!showSettings) return null

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-6 border border-white/10 animate-in fade-in duration-300">
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Slippage Tolerance</label>
        <div className="flex space-x-2">
          {[0.1, 0.5, 1.0].map((value) => (
            <button
              key={value}
              onClick={() => setSlippage(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                slippage === value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              {value}%
            </button>
          ))}
          <div className="relative flex items-center">
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="w-20 px-3 py-2 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
            <span className="absolute right-3 text-white/70 text-sm">%</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-3">Transaction Speed</label>
        <div className="flex space-x-2">
          {[
            { name: 'Standard', icon: null },
            { name: 'Fast', icon: null },
            { name: 'Instant', icon: <Zap size={14} /> },
          ].map((speed) => (
            <button
              key={speed.name}
              onClick={() => setTxnSpeed(speed.name)}
              className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                txnSpeed === speed.name
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              {speed.icon}
              <span>{speed.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-3">Gas Price (ALGO)</label>
        <input
          type="number"
          value={gasPrice}
          onChange={(e) => setGasPrice(parseFloat(e.target.value))}
          className="w-full px-4 py-3 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          placeholder="Enter gas price"
        />
      </div>
    </div>
  )
}
