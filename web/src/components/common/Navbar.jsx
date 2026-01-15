import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">

            {showPatientNav && (
              <>
                <Link to="/patient" className={linkClass('/patient')}>
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>

                <Link to="/patient/qr-code" className={linkClass('/patient/qr-code')}>
                  <Barcode className="w-5 h-5" />
                  <span>QR Code</span>
                </Link>
              </>
            )}

            {showDoctorNav && (
              <>
                <Link to="/doctor" className={linkClass('/doctor')}>
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>

                <Link to="/doctor/scanner" className={linkClass('/doctor/scanner')}>
                  <Barcode className="w-5 h-5" />
                  <span>Scan QR</span>
                </Link>
              </>
            )}

            {/* User Section */}
            {user && (
              <div className="flex items-center space-x-4 ml-6 border-l pl-6 border-neutral-200">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-semibold">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="font-semibold text-neutral-900 hidden lg:block">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <LogOut className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-neutral-200 space-y-3">

            {showPatientNav && (
              <>
                <Link to="/patient" className="mobile-link">
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/patient/qr-code" className="mobile-link">
                  <Barcode className="w-5 h-5" />
                  <span>QR Code</span>
                </Link>
              </>
            )}

            {showDoctorNav && (
              <>
                <Link to="/doctor" className="mobile-link">
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/doctor/scanner" className="mobile-link">
                  <Barcode className="w-5 h-5" />
                  <span>Scan QR</span>
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
