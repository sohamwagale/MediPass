import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, QrCode } from 'lucide-react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const DoctorPatientsList = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const doctorUid = auth?.currentUser?.uid
    if (!doctorUid || !db) {
      setLoading(false)
      return
    }

    // Set up real-time listener
    const patientsRef = collection(db, 'doctors', doctorUid, 'patients')
    const q = query(patientsRef, orderBy('addedAt', 'desc'))
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const patientsList = []
        querySnapshot.forEach((doc) => {
          patientsList.push({
            id: doc.id,
            ...doc.data(),
          })
        })
        setPatients(patientsList)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading patients:', error)
        setLoading(false)
      }
    )

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [])

  const handlePatientPress = (patient) => {
    navigate(`/doctor/patient/${patient.patientId || patient.id}`, {
      state: {
        patientName: patient.name,
        patientEmail: patient.email,
      }
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading patients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
          <Users className="w-8 h-8 text-primary-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">My Patients</h1>
          <p className="text-lg text-neutral-600">
            {patients.length} {patients.length === 1 ? 'patient' : 'patients'} total
          </p>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-20 h-20 text-neutral-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-neutral-700 mb-2">No Patients Yet</h2>
          <p className="text-neutral-600 mb-8">
            Scan a patient QR code to add them to your list
          </p>
          <button
            onClick={() => navigate('/doctor/scanner')}
            className="btn-primary px-8 py-4 text-lg flex items-center space-x-2 mx-auto"
          >
            <QrCode className="w-5 h-5" />
            <span>Scan QR Code</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => {
            const avatarLetter = (patient.name || patient.email || 'P')[0].toUpperCase()
            return (
              <div
                key={patient.id}
                onClick={() => handlePatientPress(patient)}
                className="card p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {avatarLetter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-neutral-900 truncate">{patient.name || 'Unknown Patient'}</h3>
                    <p className="text-neutral-600 text-sm truncate">{patient.email || ''}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DoctorPatientsList
