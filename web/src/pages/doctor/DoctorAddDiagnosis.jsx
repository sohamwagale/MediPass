import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Pill, FileText, Save, Stethoscope } from 'lucide-react'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const DoctorAddDiagnosis = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const patientName = location.state?.patientName || ''
  
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    prescription: '',
    dosage: '',
    instructions: '',
  })

  useEffect(() => {
    if (patientId && db) {
      loadPatient()
    } else {
      setLoading(false)
    }
  }, [patientId])

  const loadPatient = async () => {
    try {
      const patientDocRef = doc(db, 'users', patientId)
      const patientDoc = await getDoc(patientDocRef)
      
      if (patientDoc.exists()) {
        const patientData = patientDoc.data()
        setPatient({
          id: patientId,
          name: patientData.name || patientName || 'Unknown Patient',
        })
      } else {
        setPatient({
          id: patientId,
          name: patientName || 'Unknown Patient',
        })
      }
    } catch (error) {
      console.error('Error loading patient:', error)
      setPatient({
        id: patientId,
        name: patientName || 'Unknown Patient',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.diagnosis.trim()) {
      alert('Error: Please enter a diagnosis')
      return
    }

    if (!db || !auth?.currentUser || !patientId) {
      alert('Error: Unable to save. Please check your connection.')
      return
    }

    try {
      setSaving(true)

      const doctorUid = auth.currentUser.uid
      const doctorDoc = await getDoc(doc(db, 'users', doctorUid))
      const doctorData = doctorDoc.exists() ? doctorDoc.data() : {}
      const doctorName = doctorData.name || 'Dr. Unknown'

      // Save diagnosis to patient's medical records
      const medicalRecordsRef = collection(db, 'users', patientId, 'medicalRecords')
      await addDoc(medicalRecordsRef, {
        diagnosis: formData.diagnosis.trim(),
        prescription: formData.prescription.trim() || null,
        dosage: formData.dosage.trim() || null,
        instructions: formData.instructions.trim() || null,
        doctorId: doctorUid,
        doctorName: doctorName,
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
      })

      alert('Success: Diagnosis saved successfully!')
      navigate(`/doctor/patient/${patientId}`, {
        state: {
          patientName: patient?.name || patientName,
        }
      })
    } catch (error) {
      console.error('Error saving diagnosis:', error)
      alert('Error: Failed to save diagnosis. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-gradient-to-r from-success-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {patient?.name?.[0]?.toUpperCase() || 'P'}
        </div>
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Add Diagnosis</h1>
          <p className="text-xl text-neutral-600">For {patient?.name || 'Patient'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-12 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Diagnosis */}
          <div>
            <label className="block text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-3">
              <Stethoscope className="w-6 h-6 text-primary-600" />
              <span>Diagnosis *</span>
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              rows={4}
              className="w-full p-6 border-2 border-neutral-200 rounded-2xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all resize-vertical"
              placeholder="Enter diagnosis details..."
              required
            />
          </div>

          {/* Prescription */}
          <div>
            <label className="block text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-3">
              <Pill className="w-6 h-6 text-success-600" />
              <span>Prescription (Optional)</span>
            </label>
            <input
              type="text"
              value={formData.prescription}
              onChange={(e) => setFormData({...formData, prescription: e.target.value})}
              className="w-full p-6 border-2 border-neutral-200 rounded-2xl focus:ring-4 focus:ring-success-200 focus:border-success-500 transition-all mb-4"
              placeholder="Medication name"
            />
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({...formData, dosage: e.target.value})}
              className="w-full p-6 border-2 border-neutral-200 rounded-2xl focus:ring-4 focus:ring-success-200 focus:border-success-500 transition-all"
              placeholder="Dosage & frequency"
            />
          </div>
        </div>

        <div>
          <label className="block text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <span>Instructions (Optional)</span>
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            rows={3}
            className="w-full p-6 border-2 border-neutral-200 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all resize-vertical"
            placeholder="Special instructions to patient..."
          />
        </div>

        <div className="flex justify-end space-x-4 pt-8 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => navigate(`/doctor/patient/${patientId}`, {
              state: { patientName: patient?.name || patientName }
            })}
            disabled={saving}
            className="px-10 py-4 border border-neutral-300 text-neutral-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`btn-primary px-12 py-4 text-xl flex items-center space-x-3 shadow-2xl hover:shadow-3xl disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                <span>Save Diagnosis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DoctorAddDiagnosis

