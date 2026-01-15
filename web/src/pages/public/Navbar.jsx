import { Link } from "react-router-dom"
import { Shield, Menu, X } from "lucide-react"
import { useState } from "react"

const Navbar = () => {
  const [open, setOpen] = useState(false)

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-neutral-200 fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900">
            MediPass
          </span>
        </Link>



        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-neutral-800"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-neutral-200 px-6 py-6 space-y-4">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block text-neutral-700 font-medium"
          >
            Home
          </Link>

          <Link
            to="/about"
            onClick={() => setOpen(false)}
            className="block text-neutral-700 font-medium"
          >
            About
          </Link>

          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="block text-center px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
