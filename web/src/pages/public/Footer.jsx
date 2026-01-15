import { HeartPulse } from "lucide-react"

const Footer = () => {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left */}
          <div className="flex items-center gap-2 text-neutral-600">
            <HeartPulse className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-neutral-800">MediPass</span>
            <span className="text-sm">© {new Date().getFullYear()}</span>
          </div>

          {/* Center */}
          <div className="text-sm text-neutral-500 text-center">
            Secure • Fast • Privacy-Focused Healthcare
          </div>

          {/* Right */}
          <div className="flex gap-6 text-sm text-neutral-600">
            <a href="/privacy" className="hover:text-primary-600 transition">
              Privacy
            </a>
            <a href="/terms" className="hover:text-primary-600 transition">
              Terms
            </a>
            <a href="/support" className="hover:text-primary-600 transition">
              Support
            </a>
          </div>

        </div>
      </div>
    </footer>
  )
}

export default Footer
