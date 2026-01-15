import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { LogOut, Home, Barcode, Menu, X } from 'lucide-react'
import { useState } from 'react'

const Navbar = ({ showPatientNav = false, showDoctorNav = false }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = path =>
    `flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
      location.pathname === path
        ? 'bg-primary-100 text-primary-700'
        : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
    }`

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-primary-600 tracking-tight"
          >
           
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
