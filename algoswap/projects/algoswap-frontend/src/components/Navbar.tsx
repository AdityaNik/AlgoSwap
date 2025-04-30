import { BarChart3, ChevronDown, Globe, Grid, Menu, Moon, RefreshCw, Sun, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NavLink = ({ title, icon, path, currentPath, navigate }) => {
  // Check if this link is active based on the current path
  const isActive = currentPath === path

  return (
    <button
      className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium ${
        isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-300 hover:text-gray-100'
      }`}
      onClick={() => {
        navigate(`/${path}`)
      }}
    >
      {icon}
      <span>{title}</span>
    </button>
  )
}

const MobileNavLink = ({ title, icon, path, currentPath, navigate }) => {
  // Check if this link is active based on the current path
  const isActive = currentPath === path

  return (
    <button
      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium ${
        isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
      }`}
      onClick={() => {
        navigate(`/${path}`)
      }}
    >
      {icon}
      <span>{title}</span>
    </button>
  )
}

interface NavbarInterface {
  toggleWalletModal: () => void
}

const Navbar = ({ toggleWalletModal }: NavbarInterface) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Get the current path without the leading slash
  const currentPath = location.pathname.substring(1) || ''

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray bg-opacity-80 backdrop-blur-lg shadow-sm px-4 py-3">
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

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Network selector */}
          <div className="hidden sm:flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700 cursor-pointer">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Algorand</span>
            <ChevronDown size={14} />
          </div>

          {/* Theme toggle */}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full">
            {isDarkMode ? <Sun size={20} className="text-gray-300" /> : <Moon size={20} className="text-gray-400" />}
          </button>

          {/* Language */}
          <button className="p-2 rounded-full hidden sm:flex">
            <Globe size={20} className="text-gray-300" />
          </button>

          {/* Connect wallet button */}
          <button
            onClick={() => toggleWalletModal()}
            className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              isConnected ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <Wallet size={16} />
            <span>{isConnected ? '0x7a...3f4b' : 'Connect'}</span>
          </button>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-full hover:bg-gray-100" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg py-2 border-t border-gray-200">
          <MobileNavLink title="Swap" icon={<RefreshCw size={16} />} path="" currentPath={currentPath} navigate={navigate} />
          <MobileNavLink title="Pool" icon={<Grid size={16} />} path="pool" currentPath={currentPath} navigate={navigate} />
          <MobileNavLink title="Bridge" icon={<BarChart3 size={16} />} path="bridge" currentPath={currentPath} navigate={navigate} />
        </div>
      )}
    </nav>
  )
}

export default Navbar
