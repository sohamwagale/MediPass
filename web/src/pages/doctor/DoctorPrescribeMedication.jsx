import { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Pill, Droplet, Clock, Calendar, FileText, RotateCw, Save } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { useAuthStore } from '../../stores/authStore'

const DoctorPrescribeMedication = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user: doctorUser } = useAuthStore()

  // Get patient info from location state or params
  const patientName = location.state?.patientName || ''
  const patientEmail = location.state?.patientEmail || ''

  const patientLabel = useMemo(() => {
    if (patientName || patientEmail) return `${patientName || 'Patient'} (${patientEmail || ''})`
    return patientId || 'Patient'
  }, [patientEmail, patientId, patientName])

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    refills: '0',
  })
  const [saving, setSaving] = useState(false)

  const savePrescription = async () => {
    if (!patientId) {
      alert('Error: Missing patient information')
      return
    }
    if (!formData.name.trim()) {
      alert('Error: Medication name is required')
      return
    }

    try {
      setSaving(true)

      const doctorUid = auth?.currentUser?.uid
      if (!db || !doctorUid) {
        alert('Error: Doctor not logged in')
        return
      }

      const refillsNum = parseInt(formData.refills || '0', 10)

      const payload = {
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        duration: formData.duration.trim(),
        instructions: formData.instructions.trim(),
        refills: isFinite(refillsNum) ? refillsNum : 0,
        patientId,
        patientName: patientName || '',
        patientEmail: patientEmail || '',
        doctorId: doctorUid,
        doctorName: doctorUser?.name || '',
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'users', patientId, 'prescriptions'), payload)

      alert('Success: Prescription added')
      navigate(`/doctor/patient/${patientId}`)
    } catch (error) {
      console.error('Prescribe medication error:', error)
      alert('Error: ' + (error?.message || 'Failed to save prescription'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Prescribe Medication</h1>
        <p className="text-lg text-neutral-600">For: {patientLabel}</p>
      </div>

      <div className="card p-8 space-y-6">
        <Field
          label="Medication Name *"
          icon={<Pill className="w-5 h-5" />}
          value={formData.name}
          placeholder="e.g. Amlodipine"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Field
          label="Dosage"
          icon={<Droplet className="w-5 h-5" />}
          value={formData.dosage}
          placeholder="e.g. 5mg"
          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
        />
        <Field
          label="Frequency"
          icon={<Clock className="w-5 h-5" />}
          value={formData.frequency}
          placeholder="e.g. 1 tablet daily"
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
        />
        <Field
          label="Duration"
          icon={<Calendar className="w-5 h-5" />}
          value={formData.duration}
          placeholder="e.g. 30 days"
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
        />
        <Field
          label="Instructions"
          icon={<FileText className="w-5 h-5" />}
          value={formData.instructions}
          placeholder="e.g. Take in the morning with water"
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          multiline
        />
        <Field
          label="Refills"
          icon={<RotateCw className="w-5 h-5" />}
          value={formData.refills}
          placeholder="0"
          onChange={(e) => setFormData({ ...formData, refills: e.target.value })}
          type="number"
        />

        <button
          onClick={savePrescription}
          disabled={saving}
          className={`btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-3 w-full ${
            saving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save Prescription'}</span>
        </button>
      </div>
    </div>
  )
}

const Field = ({ label, icon, value, placeholder, onChange, multiline, type = 'text' }) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      {icon}
      <label className="text-sm font-semibold text-neutral-700">{label}</label>
    </div>
    {multiline ? (
      <textarea
        className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all resize-vertical min-h-[90px]"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    ) : (
      <input
        type={type}
        className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    )}
  </div>
)

export default DoctorPrescribeMedication
