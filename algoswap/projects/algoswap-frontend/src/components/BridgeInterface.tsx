import ConnectWallet from './ConnectWallet'

interface ConnectWalletInterface {
  openWalletModal: boolean
  toggleWalletModal: () => void
}

const BridgeInterface = ({ openWalletModal, toggleWalletModal }: ConnectWalletInterface) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-white">
      <div>Comming soon...</div>
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default BridgeInterface
