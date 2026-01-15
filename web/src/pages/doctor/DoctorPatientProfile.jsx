import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Download, Edit3, FileText, AlertTriangle, Heart, Phone, Pill, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { doc, getDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import MedicalTimeline from '../../components/common/MedicalTimeline'

const DoctorPatientProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { patientName: routePatientName, patientEmail: routePatientEmail } = location.state || {}
  
  const [patient, setPatient] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db || !id) {
      setLoading(false)
      return
    }

    let unsubscribePrescriptions = null

    const loadPatientData = async () => {
      try {
        // Load patient profile from Firestore
        const patientDocRef = doc(db, 'users', id)
        const patientDoc = await getDoc(patientDocRef)

        if (patientDoc.exists()) {
          const patientData = patientDoc.data()
          setPatient({
            id: id,
            name: patientData.name || routePatientName || 'Unknown Patient',
            email: patientData.email || routePatientEmail || '',
            phone: patientData.phone || '',
            bloodGroup: patientData.bloodGroup || 'Unknown',
            allergies: Array.isArray(patientData.allergies) ? patientData.allergies : [],
            medicalConditions: Array.isArray(patientData.medicalConditions) ? patientData.medicalConditions : [],
            emergencyContacts: Array.isArray(patientData.emergencyContacts) ? patientData.emergencyContacts : [],
          })
        } else {
          // Fallback to route params if doc doesn't exist
          setPatient({
            id: id,
            name: routePatientName || 'Unknown Patient',
            email: routePatientEmail || '',
            phone: '',
            bloodGroup: 'Unknown',
            allergies: [],
            medicalConditions: [],
            emergencyContacts: [],
          })
        }

        // Set up real-time listener for prescriptions
        const prescriptionsRef = collection(db, 'users', id, 'prescriptions')
        const q = query(prescriptionsRef, orderBy('createdAt', 'desc'))
        
        unsubscribePrescriptions = onSnapshot(
          q,
          (querySnapshot) => {
            const prescriptionsList = []
            querySnapshot.forEach((doc) => {
              const data = doc.data()
              prescriptionsList.push({
                id: doc.id,
                ...data,
              })
            })
            setPrescriptions(prescriptionsList)
          },
          (error) => {
            console.error('Error loading prescriptions:', error)
          }
        )
      } catch (error) {
        console.error('Error loading patient data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPatientData()

    // Cleanup function
    return () => {
      if (unsubscribePrescriptions) {
        unsubscribePrescriptions()
      }
    }
  }, [id, routePatientName, routePatientEmail])

  const handleDownloadRecords = () => {
    alert('PDF download functionality will be implemented soon.')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600">Patient not found</p>
        </div>
      </div>
    )
  }

  const avatarLetter = (patient.name || 'P')[0].toUpperCase()

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Patient Header */}
      <div className="card p-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-28 h-28 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl">
              {avatarLetter}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">{patient.name}</h1>
              <div className="flex items-center space-x-6 text-neutral-600 flex-wrap gap-2">
                {patient.email && <span>{patient.email}</span>}
                {patient.phone && <span>{patient.phone}</span>}
                <span className="font-semibold text-primary-600">{patient.bloodGroup}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleDownloadRecords}
              className="btn-primary px-8 py-4 text-lg flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Records</span>
            </button>
            <button
              onClick={() => navigate(`/doctor/add-diagnosis/${id}`, {
                state: { patientName: patient.name }
              })}
              className="px-8 py-4 border-2 border-primary-200 bg-primary-50 text-primary-700 rounded-2xl font-semibold text-lg hover:bg-primary-100 transition-all flex items-center space-x-2"
            >
              <Edit3 className="w-5 h-5" />
              <span>Add Diagnosis</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(`/doctor/prescribe/${id}`, {
            state: {
              patientName: patient.name,
              patientEmail: patient.email,
            }
          })}
          className="w-full btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-2"
        >
          <Pill className="w-5 h-5" />
          <span>Prescribe Medication</span>
        </button>
      </div>

      {/* Emergency Info */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <span>Allergies</span>
          </h3>
          <div className="space-y-4">
            {patient.allergies && patient.allergies.length > 0 ? (
              patient.allergies.map((allergy, index) => (
                <div key={index} className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-4 flex-shrink-0" />
                  <span className="font-semibold text-orange-900 text-lg">{allergy}</span>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 italic">No known allergies</p>
            )}
          </div>
        </div>

        <div className="card p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
            <Heart className="w-8 h-8 text-orange-600" />
            <span>Medical Conditions</span>
          </h3>
          <div className="space-y-4">
            {patient.medicalConditions && patient.medicalConditions.length > 0 ? (
              patient.medicalConditions.map((condition, index) => (
                <div key={index} className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-4 flex-shrink-0" />
                  <span className="font-semibold text-orange-900 text-lg">{condition}</span>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 italic">No known conditions</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      {patient.emergencyContacts && patient.emergencyContacts.length > 0 && (
        <div className="card p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
            <Phone className="w-8 h-8 text-success-600" />
            <span>Emergency Contacts</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {patient.emergencyContacts.map((contact, index) => (
              <div key={index} className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
                <p className="text-xl font-bold text-emerald-800 mb-2">{contact.name || 'Unknown'}</p>
                <p className="text-emerald-700">{contact.phone || ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical History */}
      <div className="space-y-6">
        <MedicalTimeline patientId={id} />
      </div>

      {/* Prescriptions */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Pill className="w-8 h-8 text-primary-600" />
          <h3 className="text-3xl font-bold text-neutral-900">Prescriptions</h3>
        </div>

        {prescriptions.length === 0 ? (
          <div className="card p-12 text-center">
            <Pill className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 text-lg">No prescriptions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-2xl font-bold text-neutral-900">{prescription.name || 'Unknown Medication'}</h4>
                  {prescription.refills > 0 && (
                    <span className="px-4 py-2 bg-success-100 text-success-800 rounded-xl text-sm font-semibold">
                      {prescription.refills} refills
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-neutral-700">
                    <span className="font-semibold">Dosage: </span>
                    {prescription.dosage || 'N/A'}
                  </p>
                  <p className="text-neutral-700">
                    <span className="font-semibold">Frequency: </span>
                    {prescription.frequency || 'N/A'}
                  </p>
                  <p className="text-neutral-700">
                    <span className="font-semibold">Duration: </span>
                    {prescription.duration || 'N/A'}
                  </p>
                  {prescription.instructions && (
                    <div className="mt-4 p-4 bg-primary-50 border border-primary-100 rounded-xl">
                      <p className="text-primary-800">{prescription.instructions}</p>
                    </div>
                  )}
                  {prescription.createdAt && (
                    <p className="text-sm text-neutral-500 mt-4 italic">
                      Prescribed: {prescription.createdAt.toDate ? format(prescription.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown date'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorPatientProfile

