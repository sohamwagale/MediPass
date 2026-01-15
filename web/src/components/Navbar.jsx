import { useAuthStore } from '../stores/authStore'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, User, Home, Barcode, FileText, Shield } from 'lucide-react'

const Navbar = ({ showPatientNav = false, showDoctorNav = false }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="card sticky top-0 z-50 mx-6 mt-6 backdrop-blur-sm bg-white/80">
      <div className="flex items-center justify-between p-6">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-success-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Barcode className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-success-600 bg-clip-text text-transparent">
            MediPass
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {showPatientNav && (
            <div className="hidden md:flex space-x-2">
              <Link to="/patient" className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                location.pathname === '/patient' ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:text-primary-600'
              }`}>
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/patient/qr-code" className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                location.pathname === '/patient/qr-code' ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:text-primary-600'
              }`}>
                <Barcode className="w-4 h-4" />
                <span>QR Code</span>
              </Link>
            </div>
          )}

          {showDoctorNav && (
            <div className="hidden md:flex space-x-2">
              <Link to="/doctor" className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                location.pathname === '/doctor' ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:text-primary-600'
              }`}>
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/doctor/scanner" className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                location.pathname === '/doctor/scanner' ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:text-primary-600'
              }`}>
                <Barcode className="w-4 h-4" />
                <span>Scan QR</span>
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="flex md:hidden p-2 rounded-xl hover:bg-gray--100"
            >
              <LogOut className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
