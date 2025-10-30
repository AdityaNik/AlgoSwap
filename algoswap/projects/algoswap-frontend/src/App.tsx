import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import SwapInterface from './components/Dashboard'
import Navbar from './components/Navbar'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LiquidityPoolInterface from './components/Pool'
import BridgeInterface from './components/BridgeInterface'
import { WalletProviderWrapper } from './context/WalletContext'
import { WagmiProvider, http, createConfig } from 'wagmi'
import { mainnet, sepolia, base, optimism } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'

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
  ]
}

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'c57142a1b1b714ba2301e5e5d798fe77'

const config = createConfig({
  chains: [mainnet, base, sepolia, optimism],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    metaMask(),
    safe(),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
    [optimism.id]: http(),
  },
});

const queryClient = new QueryClient()

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

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
        <WalletProviderWrapper>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <div className="flex flex-col gap-4 bg-black">
                  <div className="mb-10 h-full">
                    <Navbar />
                  </div>
                  <div className="h-full">
                    <Routes>
                      <Route path="/" element={<SwapInterface />} />
                      <Route path="/pool" element={<LiquidityPoolInterface />} />
                      <Route path="/bridge" element={<BridgeInterface />} />
                    </Routes>
                  </div>
                </div>
              </BrowserRouter>
            </QueryClientProvider>
          </WagmiProvider>
        </WalletProviderWrapper>
      </WalletProvider>
    </SnackbarProvider>
  )
}
