import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import PatientQR from '../../components/patient/PatientQR'
import MedicalTimeline from '../../components/common/MedicalTimeline'
import { Pill, AlertCircle, HeartPulse } from 'lucide-react'
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const PatientDashboard = () => {
  const { user } = useAuthStore()
  const [prescriptions, setPrescriptions] = useState([])
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const patientUid = auth?.currentUser?.uid || user?.uid || user?.id
    if (!patientUid || !db) {
      setLoading(false)
      return
    }

    // Load patient data
    const loadPatientData = async () => {
      try {
        const patientDocRef = doc(db, 'users', patientUid)
        const patientDoc = await getDoc(patientDocRef)
        
        if (patientDoc.exists()) {
          const data = patientDoc.data()
          setPatientData({
            allergies: Array.isArray(data.allergies) ? data.allergies : [],
            bloodGroup: data.bloodGroup || 'Unknown',
          })
        }
      } catch (error) {
        console.error('Error loading patient data:', error)
      }
    }

    loadPatientData()

    // Set up real-time listener for prescriptions
    const prescriptionsRef = collection(db, 'users', patientUid, 'prescriptions')
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'))

    const unsubscribePrescriptions = onSnapshot(
      q,
      (querySnapshot) => {
        const prescriptionsList = []
        querySnapshot.forEach((doc) => {
          prescriptionsList.push({
            id: doc.id,
            ...doc.data(),
          })
        })
        setPrescriptions(prescriptionsList)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading prescriptions:', error)
        setLoading(false)
      }
    )

    return () => {
      unsubscribePrescriptions()
    }
  }, [user])

  if (!user) {
    return <p className="text-center py-20">Please log in to view your dashboard.</p>
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const userName = user.name || "Patient"
  const allergiesCount = patientData?.allergies?.length || 0

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-success-500 text-white rounded-full font-semibold mb-6 shadow-2xl">
          <HeartPulse className="w-5 h-5 mr-2" />
          Your Health Records, Always Accessible
        </div>

        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
          Welcome Back, {userName}
        </h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code */}
        <PatientQR patientId={user.id || user.uid} />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/patient/prescriptions" className="card p-8 text-center group hover:scale-[1.02] transition-transform">
            <div className="w-20 h-20 bg-success-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-success-200 transition-all">
              <Pill className="w-10 h-10 text-success-600 group-hover:scale-110" />
            </div>
            <h3 className="text-3xl font-bold">{prescriptions.length}</h3>
            <p className="text-neutral-600 text-lg">Active Prescriptions</p>
          </Link>

          <Link to="/patient/emergency-profile" className="card p-8 text-center group hover:scale-[1.02] transition-transform">
            <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-all">
              <AlertCircle className="w-10 h-10 text-orange-600 group-hover:scale-110" />
            </div>
            <h3 className="text-3xl font-bold">{allergiesCount}</h3>
            <p className="text-neutral-600 text-lg">Known Allergies</p>
          </Link>
        </div>
      </div>

      {/* Medical Timeline */}
      <MedicalTimeline />
    </div>
  )
}

export default PatientDashboard
