import Navbar from '../../components/common/Navbar'
import PatientQR from '../../components/patient/PatientQR'
import MedicalTimeline from '../common/MedicalTImeline'
// import { mockPrescriptions } from '../../data/mockData'
import { Pill, Clock, AlertCircle, HeartPulse } from 'lucide-react'

const PatientDashboard = () => {
  return (
    <div className="min-h-screen">
      <Navbar showPatientNav />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-success-500 text-white rounded-full font-semibold mb-6 shadow-2xl">
            <HeartPulse className="w-5 h-5 mr-2" />
            Your Health Records, Always Accessible
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-6">
            Welcome Back
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Access your complete medical history, prescriptions, and emergency information instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* QR Code */}
          <div>
            <PatientQR patientId="patient-001" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">2 Active</h3>
              <p className="text-neutral-600">Prescriptions</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">Today 8:00 AM</h3>
              <p className="text-neutral-600">Next Dose</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">2 Allergies</h3>
              <p className="text-neutral-600">Registered</p>
            </div>
          </div>
        </div>

        {/* Medical Timeline */}
        <MedicalTimeline />
      </div>
    </div>
  )
}

export default PatientDashboard
