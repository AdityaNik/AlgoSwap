import { mockTokens, Token } from "./Dashboard";
import { TokenSelector } from "./TokenSelector";

type TokenInputProps = {
  label: string;
  token: Token | null;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenChange: (token: Token | null) => void;
  showTokenList: boolean;
  setShowTokenList: (show: boolean) => void;
  readonly?: boolean;
  showMaxHalf?: boolean;
  tokens?: Token[];
  position?: 'top' | 'bottom';
};

export const TokenInput = ({
  label,
  token,
  amount,
  onAmountChange,
  onTokenChange,
  showTokenList,
  setShowTokenList,
  readonly = false,
  showMaxHalf = false,
  tokens = mockTokens,
  position,
}: TokenInputProps) => {
  const selectedTokenData = token ? tokens.find(t => t.symbol === token.symbol) : undefined

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-white/90">{label}</label>
        <span className="text-sm text-white/60">
          Balance: {selectedTokenData?.balance || '0.00'}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-2xl px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 transition-all duration-200">
        <input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          readOnly={readonly}
          className={`bg-transparent outline-none text-2xl font-bold placeholder-white/40 ${
            readonly ? 'text-white/80' : 'text-white'
          }`}
        />
        <TokenSelector
          selectedToken={token}
          onTokenSelect={onTokenChange}
          show={showTokenList}
          setShow={setShowTokenList}
          position={position}
          tokens={tokens}
        />
      </div>

      {showMaxHalf && selectedTokenData && (
        <div className="flex justify-end mt-2 space-x-3">
          <button
            onClick={() => onAmountChange(selectedTokenData.balance.replace(',', ''))}
            className="text-sm text-purple-400 font-semibold hover:text-purple-300 transition-colors"
          >
            MAX
          </button>
          <button
            onClick={() => onAmountChange((parseFloat(selectedTokenData.balance.replace(',', '')) / 2).toString())}
            className="text-sm text-purple-400 font-semibold hover:text-purple-300 transition-colors"
          >
            HALF
          </button>
        </div>
      )}
    </div>
  )
}
