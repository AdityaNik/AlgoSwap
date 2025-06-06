import { useWallet } from '@txnlab/use-wallet-react'
import {
  BarChart3,
  Grid,
  RefreshCw,
  Wallet,
  Menu,
  Sun,
  Moon
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWalletUI } from '../context/WalletContext'

interface NavLinkProps {
  title: string
  icon: JSX.Element
  path: string
  currentPath: string
  navigate: (path: string) => void
}

const NavLink = ({ title, icon, path, currentPath, navigate }: NavLinkProps) => {
  const isActive = currentPath === path

  return (
    <button
      className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium ${
        isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-300 hover:text-gray-100'
      }`}
      onClick={() => navigate(path ? `/${path}` : '/')}
    >
      {icon}
      <span>{title}</span>
    </button>
  )
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { toggleWalletModal } = useWalletUI()

  const walletAddress = useWallet().activeAddress
  const currentPath = location.pathname.substring(1) || ''

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    setIsDarkMode(!isDarkMode)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-80 backdrop-blur-lg shadow-sm px-4 py-3 text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
            SwapDEX
          </span>
        </div>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center space-x-1">
          <NavLink title="Swap" icon={<RefreshCw size={16} />} path="" currentPath={currentPath} navigate={navigate} />
          <NavLink title="Pool" icon={<Grid size={16} />} path="pool" currentPath={currentPath} navigate={navigate} />
          <NavLink title="Bridge" icon={<BarChart3 size={16} />} path="bridge" currentPath={currentPath} navigate={navigate} />
        </div>

        {/* Right-side actions */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-700"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Wallet Connect Button */}
          <button
            onClick={toggleWalletModal}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition"
          >
            <Wallet size={16} />
            <span>
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Connect Wallet'}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-gray-700"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-2 space-y-2">
          <NavLink title="Swap" icon={<RefreshCw size={16} />} path="" currentPath={currentPath} navigate={navigate} />
          <NavLink title="Pool" icon={<Grid size={16} />} path="pool" currentPath={currentPath} navigate={navigate} />
          <NavLink title="Bridge" icon={<BarChart3 size={16} />} path="bridge" currentPath={currentPath} navigate={navigate} />
        </div>
      )}
    </nav>
  )
}

export default Navbar
