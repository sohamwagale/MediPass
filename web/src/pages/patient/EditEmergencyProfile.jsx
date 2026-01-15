import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Plus, X } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const BLOOD_GROUPS = ['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const EditEmergencyProfile = () => {
  const navigate = useNavigate()
  const [bloodGroup, setBloodGroup] = useState('Unknown')
  const [allergies, setAllergies] = useState([])
  const [conditions, setConditions] = useState([])
  const [contacts, setContacts] = useState([])

  const [tempAllergy, setTempAllergy] = useState('')
  const [tempCondition, setTempCondition] = useState('')
  const [tempName, setTempName] = useState('')
  const [tempPhone, setTempPhone] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const user = auth?.currentUser
        if (!user || !db) {
          setLoading(false)
          return
        }

        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        const d = snap.exists() ? snap.data() || {} : {}

        setBloodGroup(d.bloodGroup || 'Unknown')
        setAllergies(Array.isArray(d.allergies) ? d.allergies : [])
        setConditions(Array.isArray(d.medicalConditions) ? d.medicalConditions : [])
        setContacts(Array.isArray(d.emergencyContacts) ? d.emergencyContacts : [])
      } catch (error) {
        console.error('Failed to load emergency profile:', error)
        alert('Error: Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    try {
      const user = auth?.currentUser

      if (!user || !db) {
        alert('Error: User not logged in')
        return
      }

      setSaving(true)

      const ref = doc(db, 'users', user.uid)

      const payload = {
        bloodGroup,
        allergies,
        medicalConditions: conditions,
        emergencyContacts: contacts,
        updatedAt: new Date().toISOString(),
      }

      // Use merge to avoid overwriting core profile fields (name, email, role, etc.)
      await setDoc(ref, payload, { merge: true })

      alert('Saved: Emergency profile updated')
      navigate('/patient/emergency-profile')
    } catch (e) {
      console.error('FIRESTORE SAVE ERROR:', e)
      alert('Save failed: ' + (e.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Emergency Medical Info</h1>
        <p className="text-neutral-600">Update your critical medical information</p>
      </div>

      {/* BLOOD GROUP */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900">Blood Group</h3>
        <select
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500"
        >
          {BLOOD_GROUPS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* CONTACTS */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900">Emergency Contacts</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Name"
            className="flex-1 p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Phone"
            className="flex-1 p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500"
            value={tempPhone}
            onChange={(e) => setTempPhone(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            if (!tempName.trim() || !tempPhone.trim()) return
            setContacts((prev) => [
              ...prev,
              { name: tempName.trim(), phone: tempPhone.trim() },
            ])
            setTempName('')
            setTempPhone('')
          }}
          className="btn-primary px-4 py-3 flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Contact</span>
        </button>

        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div
              key={i}
              className="p-4 bg-neutral-50 rounded-xl flex items-center justify-between"
            >
              <span className="font-semibold">{c.name} — {c.phone}</span>
              <button
                onClick={() => setContacts((prev) => prev.filter((_, x) => x !== i))}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ALLERGIES */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900">Allergies</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add allergy"
            className="flex-1 p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500"
            value={tempAllergy}
            onChange={(e) => setTempAllergy(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && tempAllergy.trim()) {
                setAllergies((prev) => [...prev, tempAllergy.trim()])
                setTempAllergy('')
              }
            }}
          />
          <button
            onClick={() => {
              if (!tempAllergy.trim()) return
              setAllergies((prev) => [...prev, tempAllergy.trim()])
              setTempAllergy('')
            }}
            className="btn-primary px-4 py-3 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {allergies.map((x, i) => (
            <div
              key={i}
              className="p-3 bg-neutral-50 rounded-xl flex items-center space-x-2"
            >
              <span className="font-semibold">{x}</span>
              <button
                onClick={() => setAllergies((prev) => prev.filter((_, k) => k !== i))}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CONDITIONS */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900">Medical Conditions</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add condition"
            className="flex-1 p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500"
            value={tempCondition}
            onChange={(e) => setTempCondition(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && tempCondition.trim()) {
                setConditions((prev) => [...prev, tempCondition.trim()])
                setTempCondition('')
              }
            }}
          />
          <button
            onClick={() => {
              if (!tempCondition.trim()) return
              setConditions((prev) => [...prev, tempCondition.trim()])
              setTempCondition('')
            }}
            className="btn-primary px-4 py-3 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {conditions.map((x, i) => (
            <div
              key={i}
              className="p-3 bg-neutral-50 rounded-xl flex items-center space-x-2"
            >
              <span className="font-semibold">{x}</span>
              <button
                onClick={() => setConditions((prev) => prev.filter((_, k) => k !== i))}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate('/patient/emergency-profile')}
          className="flex-1 px-8 py-4 border border-neutral-300 text-neutral-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className={`flex-1 btn-primary px-8 py-4 flex items-center justify-center space-x-2 ${
            saving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save Emergency Profile'}</span>
        </button>
      </div>
    </div>
  )
}

export default EditEmergencyProfile
