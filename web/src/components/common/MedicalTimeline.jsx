import { useState, useEffect } from 'react'
import { Calendar, User, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const MedicalTimeline = ({ patientId }) => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // Use patientId from props, or fallback to current user
  const currentUserId = patientId || auth?.currentUser?.uid

  useEffect(() => {
    if (!db || !currentUserId) {
      setLoading(false)
      return
    }

    // Set up real-time listener for medical records
    const medicalRecordsRef = collection(db, 'users', currentUserId, 'medicalRecords')
    const q = query(medicalRecordsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const recordsList = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          recordsList.push({
            id: doc.id,
            diagnosis: data.diagnosis || '',
            prescription: data.prescription || null,
            dosage: data.dosage || null,
            instructions: data.instructions || null,
            doctorName: data.doctorName || 'Unknown Doctor',
            date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
            createdAt: data.createdAt,
          })
        })
        setRecords(recordsList)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading medical records:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUserId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-neutral-600">Loading medical history...</span>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-neutral-900 flex items-center space-x-3">
          <Stethoscope className="w-8 h-8 text-primary-600" />
          <span>Medical History</span>
        </h3>
        <div className="text-center py-12">
          <p className="text-neutral-500 text-lg">No medical records yet</p>
          <p className="text-neutral-400 text-sm mt-2">Your medical timeline will update as doctors add records</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-neutral-900 flex items-center space-x-3">
        <Stethoscope className="w-8 h-8 text-primary-600" />
        <span>Medical History</span>
      </h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 to-success-200"></div>
        
        {records.map((record, index) => {
          const recordDate = record.createdAt?.toDate ? record.createdAt.toDate() : new Date(record.date)
          return (
            <div key={record.id} className="relative flex items-start space-x-4 group mb-6">
              {/* Timeline Dot */}
              <div className={`absolute left-7 w-4 h-4 rounded-full z-10 border-4 transition-all ${
                index === 0 
                  ? 'bg-primary-600 border-primary-200 shadow-lg' 
                  : 'bg-success-600 border-success-200'
              }`}></div>
              
              <div className="card p-6 w-full ml-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-wrap">
                    <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-sm font-semibold text-neutral-500">
                      {format(recordDate, 'MMM dd, yyyy')}
                    </span>
                    <User className="w-5 h-5 text-neutral-400" />
                    <span className="font-semibold text-neutral-900">{record.doctorName}</span>
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-neutral-900 mb-2">
                  {record.diagnosis}
                </h4>
                
                {(record.prescription || record.dosage) && (
                  <div className="mb-4 p-3 bg-primary-50 border border-primary-100 rounded-xl">
                    <p className="font-semibold text-primary-800 mb-1">Prescription:</p>
                    {record.prescription && (
                      <p className="text-primary-700">{record.prescription}</p>
                    )}
                    {record.dosage && (
                      <p className="text-primary-700">Dosage: {record.dosage}</p>
                    )}
                  </div>
                )}
                
                {record.instructions && (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <p className="font-semibold text-neutral-800 mb-1">Instructions:</p>
                    <p className="text-neutral-700">{record.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MedicalTimeline
