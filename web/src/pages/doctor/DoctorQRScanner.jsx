import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, User, AlertCircle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { collection, query, getDocs, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { mockPatients } from '../../data/mockData'

const DoctorQRScanner = () => {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scannedPatient, setScannedPatient] = useState(null)
  const [error, setError] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    // Check for camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true)
        // Wait a bit for DOM to be ready
        setTimeout(() => {
          startScanning()
        }, 100)
      })
      .catch((err) => {
        console.error('Camera permission denied:', err)
        setHasPermission(false)
        setError('Camera access is required to scan QR codes. Please enable camera permissions.')
      })

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = () => {
    const element = document.getElementById('qr-reader')
    if (!element || html5QrCodeRef.current) return

    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await handleBarCodeScanned(decodedText)
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      )
      setIsScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Failed to start camera. Please check permissions.')
    }
  }

  const stopScanning = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
        setIsScanning(false)
      }).catch((err) => {
        console.error('Error stopping scanner:', err)
      })
    }
  }

  const handleBarCodeScanned = async (data) => {
    if (!data) return

    stopScanning()

    // Enhanced QR code validation
    const patientEmail = data.trim().toLowerCase()

    // Basic email validation
    if (!patientEmail.includes('@') || !patientEmail.includes('.')) {
      setError('Invalid QR Code: The scanned QR code does not contain a valid email address.')
      return
    }

    console.log('Looking up patient with email:', patientEmail)

    // Try to find patient in mock data first (offline/dev)
    let patient = mockPatients.find((p) => p.email.toLowerCase() === patientEmail)

    // If not found in mock data, query Firestore by email
    if (!patient && db) {
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('email', '==', patientEmail), where('role', '==', 'patient'))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const patientDoc = querySnapshot.docs[0]
          const userData = patientDoc.data()
          patient = { id: patientDoc.id, uid: patientDoc.id, ...userData }
        }
      } catch (error) {
        console.log('Firestore lookup failed:', error)
      }
    }

    if (patient) {
      console.log('Patient found:', patient)
      setScannedPatient(patient)

      const patientUid = patient.id || patient.uid
      const doctorUid = auth?.currentUser?.uid

      // Check if patient is already in doctor's list
      let isExistingPatient = false
      if (doctorUid && db && patientUid) {
        try {
          const patientDocRef = doc(db, 'doctors', doctorUid, 'patients', patientUid)
          const existingDoc = await getDoc(patientDocRef)
          isExistingPatient = existingDoc.exists()
        } catch (error) {
          console.log('Error checking existing patient:', error)
        }
      }

      if (isExistingPatient) {
        // Patient already exists, navigate directly to profile
        navigate(`/doctor/patient/${patientUid}`, {
          state: {
            patientName: patient.name || '',
            patientEmail: patient.email || patientEmail,
          }
        })
      } else {
        // New patient, add to doctor's list
        if (doctorUid && db && patientUid) {
          try {
            // Link patient under doctor
            await setDoc(
              doc(db, 'doctors', doctorUid, 'patients', patientUid),
              {
                patientId: patientUid,
                email: patient.email || patientEmail,
                name: patient.name || '',
                bloodGroup: patient.bloodGroup || '',
                allergies: patient.allergies || [],
                addedAt: serverTimestamp(),
              },
              { merge: true }
            )

            // Link doctor under patient (optional, useful later)
            await setDoc(
              doc(db, 'users', patientUid, 'doctors', doctorUid),
              {
                doctorId: doctorUid,
                addedAt: serverTimestamp(),
              },
              { merge: true }
            )

            // Navigate to patient profile
            navigate(`/doctor/patient/${patientUid}`, {
              state: {
                patientName: patient.name || '',
                patientEmail: patient.email || patientEmail,
              }
            })
          } catch (error) {
            console.error('Accept patient error:', error)
            setError('Failed to add patient. Please try again.')
          }
        }
      }
    } else {
      console.log('Patient not found for email:', patientEmail)
      setError(`No patient found with email: ${patientEmail}. This might be a new patient or the QR code is invalid.`)
    }
  }

  const resetScanner = () => {
    setScannedPatient(null)
    setError(null)
    startScanning()
  }

  if (hasPermission === false) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <AlertCircle className="w-20 h-20 text-neutral-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Camera Permission Required</h2>
          <p className="text-lg text-neutral-600 mb-8">
            Camera access is required to scan patient QR codes. Please enable camera permissions in your browser settings.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary px-8 py-4">
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="card p-12 text-center">
        {!scannedPatient && !error && hasPermission ? (
          <>
            <div id="qr-reader" className="w-full max-w-md mx-auto mb-8 rounded-2xl overflow-hidden" style={{ minHeight: '300px' }}></div>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-8">
                <div className="w-32 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                <span className="text-green-600 font-semibold">Scanning...</span>
                <div className="w-32 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
              </div>
              
              <h2 className="text-4xl font-bold text-neutral-900 mb-4">Position QR Code</h2>
              <p className="text-xl text-neutral-600 mb-8">
                Hold patient's QR code within the frame. The QR code contains the patient's email address.
              </p>
            </div>
          </>
        ) : scannedPatient ? (
          <>
            <div className="w-32 h-32 bg-gradient-to-r from-success-500 to-emerald-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="w-20 h-20 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Patient Identified</h2>
            <div className="w-full h-px bg-gradient-to-r from-success-500 to-emerald-600 mx-auto mb-12" />
            
            <div className="flex items-center justify-center space-x-6 p-8 bg-success-50 rounded-3xl mb-8">
              <div className="w-20 h-20 bg-success-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {scannedPatient.name?.[0] || 'P'}
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-success-800">{scannedPatient.name || 'Unknown'}</h3>
                <p className="text-success-700">
                  {scannedPatient.bloodGroup || 'Unknown'} | {scannedPatient.phone || scannedPatient.email || ''}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(`/doctor/patient/${scannedPatient.id || scannedPatient.uid}`, {
                  state: {
                    patientName: scannedPatient.name || '',
                    patientEmail: scannedPatient.email || '',
                  }
                })}
                className="btn-primary px-12 py-4 text-xl flex items-center space-x-3"
              >
                <User className="w-6 h-6" />
                <span>View Profile</span>
              </button>
              <button 
                onClick={resetScanner}
                className="px-12 py-4 border-2 border-neutral-200 rounded-2xl font-semibold text-xl hover:bg-gray-50 transition-all flex items-center space-x-3"
              >
                <Camera className="w-6 h-6" />
                <span>Scan Again</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-20 h-20 text-neutral-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Error</h2>
            <p className="text-lg text-neutral-600 mb-8">{error}</p>
            <button onClick={resetScanner} className="btn-primary px-8 py-4">
              Scan Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default DoctorQRScanner

