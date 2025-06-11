import { useState, useEffect } from 'react'
import { Connector, CreateConnectorFn, useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'
import { useConnect } from 'wagmi'

export function ConnectEthWallet({ onClose, showWalletConnect }: { onClose?: any, showWalletConnect?: boolean }) {
  const { isConnected } = useAccount()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Auto-open dialog if onClose is provided (called from parent)
  useEffect(() => {
    if (showWalletConnect) {
      setIsDialogOpen(true)
    }
  }, [showWalletConnect])

  // Close dialog and notify parent when connection is successful
  useEffect(() => {
    if (isConnected && isDialogOpen) {
      setIsDialogOpen(false)
      if (onClose) {
        onClose()
      }
    }
  }, [isConnected, isDialogOpen, onClose])

  // If connected, show account info
  if (isConnected) return <Account />

  const handleClose = () => {
    setIsDialogOpen(false)
    if (onClose) onClose()
  }

  return (
    <>
      {!showWalletConnect && (
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      )}

      {isDialogOpen && (
        <WalletDialog
          isOpen={isDialogOpen}
          onClose={handleClose}
        />
      )}
    </>
  )
}

function WalletDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        {/* Dialog content */}
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Connect Wallet</h2>
        <p className="text-gray-600 mb-6">Choose a wallet to connect to your account</p>

        <WalletOptions onConnect={onClose} />
      </div>
    </div>
  )
}

function WalletOptions({ onConnect }: { onConnect: () => void }) {
  const { connectors, connect } = useConnect()
  const { isConnected } = useAccount()

  const handleConnect = async (connector: Connector<CreateConnectorFn>) => {
    try {
      await connect({ connector })
      // Don't close immediately - let the useEffect in parent handle it
      // This ensures the connection is fully established
    } catch (error) {
      console.error('Failed to connect:', error)
      // Handle connection error if needed
    }
  }

  // Close dialog if connection is successful
  useEffect(() => {
    if (isConnected) {
      onConnect()
    }
  }, [isConnected, onConnect])

  return (
    <div className="space-y-3">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => handleConnect(connector)}
          className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
        >
          <span className="font-medium text-gray-900">{connector.name}</span>
          <span className="text-sm text-gray-500">Connect</span>
        </button>
      ))}
    </div>
  )
}

function Account() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  return (
    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-gray-50">
      {ensAvatar && (
        <img
          alt="ENS Avatar"
          src={ensAvatar}
          className="w-8 h-8 rounded-full"
        />
      )}
      {address && (
        <div className="flex-1">
          <div className="font-medium text-sm text-black">
            {ensName ? `${ensName} (${address})` : address}
          </div>
        </div>
      )}
      <button
        onClick={() => disconnect()}
        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
      >
        Disconnect
      </button>
    </div>
  )
}
