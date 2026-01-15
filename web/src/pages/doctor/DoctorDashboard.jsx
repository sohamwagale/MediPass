import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Users, Calendar, Stethoscope } from 'lucide-react'
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsToday: 0,
    pendingReports: 0,
    newDiagnoses: 0,
  })
  const [recentPatients, setRecentPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const doctorUid = auth?.currentUser?.uid
      if (!doctorUid || !db) {
        setLoading(false)
        return
      }

      // Load patient count
      const patientsRef = collection(db, 'doctors', doctorUid, 'patients')
      const patientsSnapshot = await getDocs(patientsRef)
      const totalPatients = patientsSnapshot.size

      // Calculate patients added today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let patientsToday = 0
      const recentPatientsList = []
      
      patientsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.addedAt) {
          const addedDate = data.addedAt.toDate ? data.addedAt.toDate() : new Date(data.addedAt)
          if (addedDate >= today) {
            patientsToday++
          }
        }
        recentPatientsList.push({
          id: doc.id,
          patientId: data.patientId || doc.id,
          name: data.name || 'Unknown Patient',
          email: data.email || '',
          bloodGroup: data.bloodGroup || 'Unknown',
          allergies: data.allergies || [],
        })
      })
      
      // Sort by addedAt and take first 5
      recentPatientsList.sort((a, b) => {
        const aDate = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(0)
        const bDate = b.addedAt?.toDate ? b.addedAt.toDate() : new Date(0)
        return bDate - aDate
      })
      setRecentPatients(recentPatientsList.slice(0, 5))

      setStats({
        totalPatients,
        patientsToday,
        pendingReports: 0,
        newDiagnoses: 0,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Scanner */}
      <div className="text-center">
        <div 
          onClick={() => navigate('/doctor/scanner')}
          className="card p-12 mx-auto max-w-2xl group hover:scale-[1.02] cursor-pointer transition-all"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mx-auto mb-8 flex items-center justify-center border-4 border-dashed border-gray-300 group-hover:border-primary-300 transition-all">
            <Camera className="w-20 h-20 text-gray-400 group-hover:text-primary-500 transition-colors" />
          </div>
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">Scan Patient QR</h2>
          <p className="text-xl text-neutral-600 mb-8">Hold any smartphone camera to scan</p>
          <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-success-500 to-emerald-600 text-white rounded-3xl font-semibold text-lg shadow-2xl group-hover:shadow-3xl transition-all">
            <Stethoscope className="w-6 h-6 mr-3" />
            Start Scan
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="card p-10 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-4xl font-bold text-neutral-900 mb-2">{stats.totalPatients}</h3>
          <p className="text-xl text-neutral-600">Total Patients</p>
        </div>
        
        <div className="card p-10 text-center">
          <div className="w-24 h-24 bg-success-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-success-600" />
          </div>
          <h3 className="text-4xl font-bold text-neutral-900 mb-2">{stats.patientsToday}</h3>
          <p className="text-xl text-neutral-600">Added Today</p>
        </div>
        
        <div className="card p-10 text-center">
          <div className="w-24 h-24 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-12 h-12 text-orange-600" />
          </div>
          <h3 className="text-4xl font-bold text-neutral-900 mb-2">{stats.newDiagnoses}</h3>
          <p className="text-xl text-neutral-600">New Diagnoses</p>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="card overflow-hidden">
        <div className="p-8 border-b border-neutral-200">
          <h3 className="text-3xl font-bold flex items-center space-x-3">
            <Users className="w-9 h-9 text-primary-600" />
            <span>Recent Patients</span>
          </h3>
        </div>
        
        {recentPatients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-neutral-700 mb-2">No patients yet</p>
            <p className="text-neutral-500 mb-6">Scan a QR code to add your first patient</p>
            <button
              onClick={() => navigate('/doctor/scanner')}
              className="btn-primary px-6 py-3"
            >
              Scan QR Code
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentPatients.map(patient => (
              <Link 
                key={patient.id} 
                to={`/doctor/patient/${patient.patientId || patient.id}`}
                className="p-8 hover:bg-gray-50 transition-colors flex items-center space-x-4"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {patient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xl text-neutral-900 truncate">{patient.name}</h4>
                  <p className="text-neutral-600">
                    {patient.bloodGroup} {patient.allergies.length > 0 ? `| ${patient.allergies[0]}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-4 py-2 bg-primary-100 text-primary-800 rounded-xl text-sm font-semibold">
                    View
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard
