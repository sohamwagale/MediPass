import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuthStore } from "./stores/authStore"

// Layouts
import PublicLayout from "./layouts/PublicLayout"
import PatientLayout from "./layouts/PatientLayout"
import DoctorLayout from "./layouts/DoctorLayout"

// Public Pages
import LandingPage from "./pages/public/LandingPage"
import RoleSelection from "./pages/public/RoleSelection"
import AuthPage from "./pages/public/AuthPage"

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard"
import PatientQRCode from "./pages/patient/PatientQRCode"
import PatientMedicalTimeline from "./pages/patient/PatientMedicalTimeline"
import PatientPrescriptions from "./pages/patient/PatientPrescriptions"
import PatientEmergencyProfile from "./pages/patient/PatientEmergencyProfile"
import EditEmergencyProfile from "./pages/patient/EditEmergencyProfile"
import PatientChatbot from "./pages/patient/PatientChatbot"

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard"
import DoctorQRScanner from "./pages/doctor/DoctorQRScanner"
import DoctorPatientProfile from "./pages/doctor/DoctorPatientProfile"
import DoctorAddDiagnosis from "./pages/doctor/DoctorAddDiagnosis"
import DoctorPrescribeMedication from "./pages/doctor/DoctorPrescribeMedication"
import DoctorPatientsList from "./pages/doctor/DoctorPatientsList"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  const { initializeAuth, loading } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  if (loading) return null // or loader

  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/select-role" element={<RoleSelection />} />
      </Route>

      {/* Patient */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute role="patient">
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="qr-code" element={<PatientQRCode />} />
        <Route path="medical-timeline" element={<PatientMedicalTimeline />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="chatbot" element={<PatientChatbot/>}/>
        <Route path="emergency-profile" element={<PatientEmergencyProfile />} />
        <Route path="edit-emergency-profile" element={<EditEmergencyProfile />} />
      </Route>

      {/* Doctor */}
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute role="doctor">
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="scanner" element={<DoctorQRScanner />} />
        <Route path="patients" element={<DoctorPatientsList />} />
        <Route path="patient/:id" element={<DoctorPatientProfile />} />
        <Route path="add-diagnosis/:patientId" element={<DoctorAddDiagnosis />} />
        <Route path="prescribe/:patientId" element={<DoctorPrescribeMedication />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
