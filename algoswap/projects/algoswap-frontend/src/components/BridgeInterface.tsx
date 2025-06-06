import { useWalletUI } from '../context/WalletContext'
import ConnectWallet from './ConnectWallet'

const BridgeInterface = () => {
  const { openWalletModal, toggleWalletModal } = useWalletUI();

  return (
    <div className="h-screen flex flex-col items-center text-white justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20">
      <div>Comming soon...</div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default BridgeInterface
