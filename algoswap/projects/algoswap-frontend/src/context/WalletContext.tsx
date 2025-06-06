import { createContext, useContext, useState } from "react";


interface WalletContextType {
  openWalletModal: boolean;
  toggleWalletModal: () => void;
  setOpenWalletModal: (openWalletModal: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProviderWrapper = ({children} : {children: React.ReactNode}) => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false);

  const toggleWalletModal = () => {
    setOpenWalletModal((prev) => !prev);
  }

  return (
    <WalletContext.Provider value={{ openWalletModal, toggleWalletModal, setOpenWalletModal }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWalletUI = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletUI must be used within a WalletProviderWrapper");
  }
  return context;
}
