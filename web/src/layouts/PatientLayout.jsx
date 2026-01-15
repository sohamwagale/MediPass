import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'

const PatientLayout = () => (
  <div className="min-h-screen flex bg-gray-50">
    <Sidebar role="patient" />
    <div className="flex-1">
      <Navbar showPatientNav />
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  </div>
)

export default PatientLayout
