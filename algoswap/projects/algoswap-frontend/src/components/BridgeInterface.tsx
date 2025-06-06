import { useWalletUI } from '../context/WalletContext'
import ConnectWallet from './ConnectWallet'

const BridgeInterface = () => {
  const { openWalletModal, toggleWalletModal } = useWalletUI();

  return (
    <div className="h-screen flex flex-col items-center justify-center text-white">
      <div>Comming soon...</div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default BridgeInterface
