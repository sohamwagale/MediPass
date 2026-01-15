import { useState, useEffect, useMemo } from 'react'
import { Pill, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { useAuthStore } from '../../stores/authStore'

const PatientPrescriptions = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    const patientUid = auth?.currentUser?.uid || user?.uid || user?.id
    if (!patientUid || !db) {
      setPrescriptions([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', patientUid, 'prescriptions'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setPrescriptions(rows)
        setLoading(false)
      },
      (error) => {
        console.error('Prescription subscription error:', error)
        setPrescriptions([])
        setLoading(false)
      }
    )

    return () => unsub()
  }, [user])

  const cards = useMemo(() => {
    return prescriptions.map((p) => {
      const createdAtDate =
        p.createdAt && typeof p.createdAt?.toDate === 'function'
          ? p.createdAt.toDate()
          : null
      const timeText = createdAtDate ? format(createdAtDate, 'dd MMM yyyy, HH:mm') : '—'

      return {
        ...p,
        timeText,
      }
    })
  }, [prescriptions])

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-success-100 rounded-2xl flex items-center justify-center">
          <Pill className="w-8 h-8 text-success-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Prescriptions</h1>
          <p className="text-neutral-600">Medication schedule and reminders</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading prescriptions...</p>
          </div>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20">
          <Pill className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-700 mb-2">No prescriptions yet</h3>
          <p className="text-neutral-500">
            Ask your doctor to scan your QR code and add prescriptions.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((prescription) => (
            <div key={prescription.id} className="card p-8 group hover:shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-2xl font-bold text-neutral-900">{prescription.name || 'Unknown Medication'}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  (prescription.refills ?? 0) > 0 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {prescription.refills ?? 0} refills
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-neutral-700">
                  <span className="font-semibold">Dosage:</span>
                  <span className="ml-2">{prescription.dosage || '—'}</span>
                </div>
                <div className="flex items-center text-neutral-700">
                  <span className="font-semibold">Frequency:</span>
                  <span className="ml-2">{prescription.frequency || '—'}</span>
                </div>
                <div className="flex items-center text-neutral-700">
                  <span className="font-semibold">Duration:</span>
                  <span className="ml-2">{prescription.duration || '—'}</span>
                </div>
                <div className="flex items-center text-neutral-700">
                  <span className="font-semibold">Prescribed:</span>
                  <span className="ml-2 text-sm">{prescription.timeText}</span>
                </div>
              </div>

              {prescription.instructions && (
                <div className="p-4 bg-primary-50 border border-primary-100 rounded-2xl mb-6">
                  <p className="text-sm text-primary-800">{prescription.instructions}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-lg font-semibold text-primary-600">
                  <Clock className="w-5 h-5" />
                  <span>{prescription.doctorName ? `Dr. ${prescription.doctorName}` : 'Doctor'}</span>
                </div>
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientPrescriptions
