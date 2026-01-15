import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Phone, Droplets, AlertTriangle, Heart, Edit } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { useAuthStore } from '../../stores/authStore'

const DEFAULT_PROFILE = {
  name: 'Patient',
  email: '',
  phone: '',
  role: 'patient',
  bloodGroup: 'Unknown',
  allergies: [],
  medicalConditions: [],
  emergencyContacts: []
}

const PatientEmergencyProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      console.warn('Firebase not initialized for PatientEmergencyProfile')
      setLoading(false)
      return
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      const ref = doc(db, 'users', firebaseUser.uid)

      const unsubscribeDoc = onSnapshot(
        ref,
        async (snap) => {
          try {
            if (!snap.exists()) {
              const newProfile = {
                ...DEFAULT_PROFILE,
                name: firebaseUser.displayName || user?.name || 'New Patient',
                email: firebaseUser.email || '',
                createdAt: serverTimestamp(),
              }
              setProfile(newProfile)
              setLoading(false)
              return
            }

            const data = snap.data() || {}

            setProfile({
              name: data.name || DEFAULT_PROFILE.name,
              email: data.email || '',
              phone: data.phone || '',
              role: data.role || 'patient',
              bloodGroup: data.bloodGroup || 'Unknown',
              allergies: Array.isArray(data.allergies) ? data.allergies : [],
              medicalConditions: Array.isArray(data.medicalConditions)
                ? data.medicalConditions
                : [],
              emergencyContacts: Array.isArray(data.emergencyContacts)
                ? data.emergencyContacts
                : [],
            })

            setLoading(false)
          } catch (e) {
            console.error('Profile load error:', e)
            setProfile(null)
            setLoading(false)
          }
        },
        (error) => {
          console.error('onSnapshot error in PatientEmergencyProfile:', error)
          setProfile(null)
          setLoading(false)
        }
      )

      return unsubscribeDoc
    })

    return () => {
      if (typeof unsubscribeAuth === 'function') {
        unsubscribeAuth()
      }
    }
  }, [user])

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

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600">Please log in to view your emergency profile</p>
        </div>
      </div>
    )
  }

  const avatarLetter = profile.name?.[0]?.toUpperCase() || 'P'

  const renderList = (title, icon, items, color, empty) => (
    <div className="card p-6 space-y-4">
      <div className="flex items-center space-x-3">
        {icon}
        <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="p-4 bg-neutral-50 rounded-xl">
              <p className="font-semibold text-neutral-900">
                {typeof item === 'string' ? item : `${item.name} — ${item.phone}`}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-500 italic">{empty}</p>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Emergency Profile</h1>
          <p className="text-neutral-600">Critical medical information</p>
        </div>
      </div>

      {/* Patient Card */}
      <div className="card p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700">{avatarLetter}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900">{profile.name}</h3>
            <p className="text-neutral-600">{profile.email || 'No email'}</p>
          </div>
        </div>

        <div className="p-6 bg-primary-50 rounded-2xl text-center">
          <Droplets className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-primary-800 mb-1">{profile.bloodGroup}</div>
          <div className="text-sm text-primary-700">Blood Group</div>
        </div>
      </div>

      {renderList('Emergency Contacts', <Phone className="w-6 h-6 text-success-600" />, profile.emergencyContacts, 'success', 'No emergency contacts')}
      {renderList('Allergies', <AlertTriangle className="w-6 h-6 text-neutral-700" />, profile.allergies, 'neutral', 'No known allergies')}
      {renderList('Medical Conditions', <Heart className="w-6 h-6 text-red-600" />, profile.medicalConditions, 'error', 'No known conditions')}

      <button
        onClick={() => navigate('/patient/edit-emergency-profile')}
        className="w-full btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-2"
      >
        <Edit className="w-5 h-5" />
        <span>Edit Emergency Profile</span>
      </button>
    </div>
  )
}

export default PatientEmergencyProfile
