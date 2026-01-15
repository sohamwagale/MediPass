import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Barcode, 
  FileText, 
  Shield, 
  Clock, 
  Users,
  Stethoscope,
  Camera,
  User,
  LogOut  
} from 'lucide-react'
import { MessageCircleMore } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const Sidebar = ({ role = 'patient' }) => {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const patientLinks = [
    { path: '/patient', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patient/qr-code', icon: Barcode, label: 'QR Code' },
    { path: '/patient/medical-timeline', icon: FileText, label: 'Medical History' },
    { path: '/patient/chatbot' , icon:MessageCircleMore , label:'Chatbot'},
    { path: '/patient/prescriptions', icon: Clock, label: 'Prescriptions' },
    { path: '/patient/emergency-profile', icon: Shield, label: 'Emergency Profile' }
  ]

  const doctorLinks = [
    { path: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/doctor/scanner', icon: Camera, label: 'Scan QR' },
    { path: '/doctor/patients', icon: Users, label: 'My Patients' },
  ]

  const links = role === 'doctor' ? doctorLinks : patientLinks

  return (
    <div className={`bg-white border-r border-neutral-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-success-600 rounded-xl flex items-center justify-center shrink-0">
            <Barcode className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
              MediPass
            </span>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 p-2 rounded-xl hover:bg-gray--100 transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          // Check if current path matches exactly, or starts with link path for dynamic routes
          let isActive = location.pathname === link.path
          if (!isActive && link.path === '/doctor/patients') {
            // Match /doctor/patients or any /doctor/patient/:id route
            isActive = location.pathname === '/doctor/patients' || 
                      (location.pathname.startsWith('/doctor/patient/') && 
                       !location.pathname.includes('/add-diagnosis') &&
                       !location.pathname.includes('/prescribe'))
          }
          
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`group flex items-center space-x-3 p-4 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-neutral-700 hover:bg-gray--100 hover:text-primary-600'
              }`}
            >
              <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : ''}`} />
              {!isCollapsed && (
                <span className={`font-medium ${isActive ? 'font-semibold text-white' : ''}`}>
                  {link.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      
    </div>
  )
}

export default Sidebar
