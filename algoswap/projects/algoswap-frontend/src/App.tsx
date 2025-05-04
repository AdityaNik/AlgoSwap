import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import Home from './Home'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import SwapInterface from './components/Dashboard'
import Navbar from './components/Navbar'
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LiquidityPoolInterface from './components/Pool'
import BridgeInterface from './components/BridgeInterface'

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <BrowserRouter>
          <div className="flex flex-col gap-4 bg-black">
            <div className="mb-10 h-full">
              <Navbar toggleWalletModal={toggleWalletModal} />
            </div>
            <div className="h-full">
              <Routes>
                <Route path="/" element={<SwapInterface openWalletModal={openWalletModal} toggleWalletModal={toggleWalletModal} />} />
                <Route
                  path="/pool"
                  element={<LiquidityPoolInterface openWalletModal={openWalletModal} toggleWalletModal={toggleWalletModal} />}
                />
                <Route
                  path="/bridge"
                  element={<BridgeInterface openWalletModal={openWalletModal} toggleWalletModal={toggleWalletModal} />}
                />
                <Route path="/home" element={<Home />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </WalletProvider>
    </SnackbarProvider>
  )
}
