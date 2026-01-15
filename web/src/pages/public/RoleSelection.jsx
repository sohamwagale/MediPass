import { Link,/* useSearchParams */} from 'react-router-dom'
import { User, UserCog, ArrowRight, Shield } from 'lucide-react'
import Navbar from './Navbar'

const RoleSelection = () => {
  // const [searchParams] = useSearchParams()

  return (
    <>
    <Navbar/>
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary-50 to-success-50">
      <div className="max-w-2xl w-full grid md:grid-cols-2 gap-8">
        {/* Patient Card */}
        <Link to="/auth?role=patient" className="group card p-10 hover:scale-[1.02] transition-all duration-500 h-full flex flex-col">
          <div className="w-24 h-24 bg-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary-600 group-hover:scale-110 transition-all">
            <User className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-6 text-center">Patient</h2>
          <p className="text-neutral-600 mb-8 leading-relaxed flex-1">
            Access your medical records, QR code, prescriptions, and emergency information instantly.
          </p>
          <div className="flex items-center justify-center text-primary-600 font-semibold group-hover:translate-x-2 transition-all mt-auto">
            Continue as Patient 
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Doctor Card */}
        <Link to="/auth?role=doctor" className="group card p-10 hover:scale-[1.02] transition-all duration-500 h-full flex flex-col">
          <div className="w-24 h-24 bg-success-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-success-600 group-hover:scale-110 transition-all">
            <UserCog className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-6 text-center">Doctor</h2>
          <p className="text-neutral-600 mb-8 leading-relaxed flex-1">
            Scan patient QR codes, view medical history, add diagnoses and generate digital prescriptions.
          </p>
          <div className="flex items-center justify-center text-success-600 font-semibold group-hover:translate-x-2 transition-all mt-auto">
            Continue as Doctor
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Security Badge */}
       
      </div>
    </div>
    </>
  )
}

export default RoleSelection  // ✅ DEFAULT EXPORT
