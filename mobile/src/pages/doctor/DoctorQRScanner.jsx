import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { mockPatients } from '../../data/mockData'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'
import { auth, db } from '../../services/firebase'
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'

const DoctorQRScanner = () => {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [scannedPatient, setScannedPatient] = useState(null)
  const [isScanning, setIsScanning] = useState(true)
  const navigation = useNavigation()

  useEffect(() => {
    console.log('QR Scanner initializing...', { hasPermission: permission?.granted })
  }, [permission])

  const handleBarCodeScanned = async ({ type, data }) => {
    console.log('QR Code scanned:', { type, data })
    
    if (!scanned && isScanning) {
      setScanned(true)
      setIsScanning(false)
      
      // Enhanced QR code validation
      const patientEmail = data.trim().toLowerCase()
      
      // Basic email validation
      if (!patientEmail.includes('@') || !patientEmail.includes('.')) {
        Alert.alert(
          'Invalid QR Code',
          'The scanned QR code does not contain a valid email address. Please scan a patient QR code.',
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setScanned(false)
                setIsScanning(true)
                setScannedPatient(null)
              }
            }
          ]
        )
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
          // Update existing patient record with latest data (including bloodGroup)
          if (doctorUid && db && patientUid) {
            try {
              // Fetch full patient data to get bloodGroup
              let patientData = { ...patient }
              const patientDocRef = doc(db, 'users', patientUid)
              const patientDoc = await getDoc(patientDocRef)
              if (patientDoc.exists()) {
                patientData = { ...patientData, ...patientDoc.data() }
              }

              // Update patient record with latest data
              await setDoc(
                doc(db, 'doctors', doctorUid, 'patients', patientUid),
                {
                  patientId: patientUid,
                  email: patientData.email || patientEmail,
                  name: patientData.name || '',
                  bloodGroup: patientData.bloodGroup || 'Unknown',
                  allergies: patientData.allergies || [],
                },
                { merge: true },
              )
            } catch (error) {
              console.log('Error updating patient data:', error)
            }
          }

          // Patient already exists, navigate directly to profile
          navigation.navigate('DoctorPatientProfile', {
            patientId: patientUid,
            patientName: patient.name || '',
            patientEmail: patient.email || patientEmail,
          })
          // Reset scanner after navigation
          setTimeout(() => {
            setScanned(false)
            setIsScanning(true)
            setScannedPatient(null)
          }, 500)
        } else {
          // New patient, show accept dialog
          Alert.alert(
            'Add Patient?',
            `Name: ${patient.name || 'Unknown'}\nEmail: ${patient.email || patientEmail}\n\nDo you want to add/accept this patient?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  // Reset scanner
                  setScanned(false)
                  setIsScanning(true)
                  setScannedPatient(null)
                },
              },
              {
                text: 'Accept',
                style: 'default',
                onPress: async () => {
                  try {
                    if (!doctorUid || !db) {
                      Alert.alert('Error', 'Doctor not logged in')
                      return
                    }
                    if (!patientUid) {
                      Alert.alert('Error', 'Invalid patient record')
                      return
                    }

                    // Fetch full patient data to get bloodGroup
                    let patientData = { ...patient }
                    if (db && patientUid) {
                      try {
                        const patientDocRef = doc(db, 'users', patientUid)
                        const patientDoc = await getDoc(patientDocRef)
                        if (patientDoc.exists()) {
                          patientData = { ...patientData, ...patientDoc.data() }
                        }
                      } catch (error) {
                        console.log('Error fetching patient data:', error)
                      }
                    }

                    // Link patient under doctor
                    await setDoc(
                      doc(db, 'doctors', doctorUid, 'patients', patientUid),
                      {
                        patientId: patientUid,
                        email: patientData.email || patientEmail,
                        name: patientData.name || '',
                        bloodGroup: patientData.bloodGroup || 'Unknown',
                        allergies: patientData.allergies || [],
                        addedAt: serverTimestamp(),
                      },
                      { merge: true },
                    )

                    // Link doctor under patient (optional, useful later)
                    await setDoc(
                      doc(db, 'users', patientUid, 'doctors', doctorUid),
                      {
                        doctorId: doctorUid,
                        addedAt: serverTimestamp(),
                      },
                      { merge: true },
                    )

                    // Navigate to patient profile instead of prescription page
                    navigation.navigate('DoctorPatientProfile', {
                      patientId: patientUid,
                      patientName: patientData.name || '',
                      patientEmail: patientData.email || patientEmail,
                    })
                    // Reset scanner after navigation
                    setTimeout(() => {
                      setScanned(false)
                      setIsScanning(true)
                      setScannedPatient(null)
                    }, 500)
                  } catch (error) {
                    console.error('Accept patient error:', error)
                    Alert.alert('Error', error?.message || 'Failed to accept patient')
                    // Reset scanner on error
                    setScanned(false)
                    setIsScanning(true)
                    setScannedPatient(null)
                  }
                },
              },
            ],
          )
        }
      } else {
        console.log('Patient not found for email:', patientEmail)
        // Patient not found - show error
        Alert.alert(
          'Patient Not Found',
          `No patient found with email: ${patientEmail}\n\nThis might be a new patient or the QR code is invalid.`,
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setScanned(false)
                setIsScanning(true)
                setScannedPatient(null)
              }
            }
          ]
        )
      }
    }
  }

  const handleScanSuccess = () => {
    // Mock scan success - for testing with actual patient email
    setScanned(true)
    setIsScanning(false)
    setScannedPatient(mockPatients[0])
    console.log('Mock scan triggered with patient:', mockPatients[0])
  }

  const testWithPatientEmail = () => {
    // Test with the actual patient email from mock data
    const testEmail = mockPatients[0].email
    console.log('Testing with email:', testEmail)
    handleBarCodeScanned({ type: 'qr', data: testEmail })
  }

  const toggleTorch = async () => {
    if (BarCodeScanner && scannerAvailable) {
      try {
        const newTorchState = !torchEnabled
        setTorchEnabled(newTorchState)
        console.log('Torch toggled:', newTorchState)
        // Note: Torch control would require additional implementation
        // This is a placeholder for the functionality
      } catch (error) {
        console.warn('Torch control not available:', error)
      }
    }
  }

  const resetScanner = () => {
    setScanned(false)
    setIsScanning(true)
    setScannedPatient(null)
  }

  const openSettings = () => {
    Linking.openSettings()
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.centerContent}>
              <Ionicons name="camera-outline" size={80} color={colors.neutral[400]} />
              <Text style={styles.errorTitle}>Camera Permission Required</Text>
              <Text style={styles.errorText}>
                Camera access is required to scan patient QR codes. Please enable camera permissions in your device settings.
              </Text>
              
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={requestPermission}
              >
                <Ionicons name="camera" size={20} color={colors.white} />
                <Text style={styles.settingsButtonText}>Grant Permission</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={openSettings}
              >
                <Ionicons name="settings" size={20} color={colors.white} />
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
              
              <View style={styles.mockScannerContainer}>
                <View style={styles.mockScannerFrame}>
                  <Ionicons name="qr-code" size={120} color={colors.neutral[300]} />
                  <Text style={styles.mockScannerText}>Mock Scanner</Text>
                </View>
                
                <View style={styles.scannerInfo}>
                  <View style={styles.scanningIndicator}>
                    <View style={styles.scanningBar} />
                    <Text style={styles.scanningText}>Ready to Scan</Text>
                    <View style={styles.scanningBar} />
                  </View>
                  
                  <Text style={styles.instructionTitle}>Position QR Code</Text>
                  <Text style={styles.instructionText}>Use the button below to simulate scanning a patient QR code</Text>
                  
                  <TouchableOpacity
                    style={styles.foundButton}
                    onPress={testWithPatientEmail}
                  >
                    <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                    <Text style={styles.foundButtonText}>Test with Patient Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <View style={styles.card}>
          {!scanned ? (
            <>
              <View style={styles.scannerContainer}>
                <CameraView
                  style={styles.scanner}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={scanned || !isScanning ? undefined : handleBarCodeScanned}
                />
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerFrame} />
                  <View style={styles.cornerTopLeft} />
                  <View style={styles.cornerTopRight} />
                  <View style={styles.cornerBottomLeft} />
                  <View style={styles.cornerBottomRight} />
                </View>
              </View>
              
              <View style={styles.scannerInfo}>
                <View style={styles.scanningIndicator}>
                  <View style={styles.scanningBar} />
                  <Text style={styles.scanningText}>Scanning...</Text>
                  <View style={styles.scanningBar} />
                </View>
                
                <Text style={styles.instructionTitle}>Position QR Code</Text>
                <Text style={styles.instructionText}>
                  Hold patient's QR code within the frame. The QR code contains the patient's email address.
                </Text>
                
                <TouchableOpacity
                  style={styles.foundButton}
                  onPress={testWithPatientEmail}
                >
                  <Ionicons name="checkmark-circle" size={24} color={colors.white} />
                  <Text style={styles.foundButtonText}>Test with Patient Email</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color={colors.white} />
              </View>
              <Text style={styles.successTitle}>Patient Identified</Text>
              <View style={styles.divider} />
              
              {scannedPatient ? (
                <>
                  <View style={styles.patientInfo}>
                    <View style={styles.patientAvatar}>
                      <Text style={styles.patientAvatarText}>{scannedPatient.name[0]}</Text>
                    </View>
                    <View style={styles.patientDetails}>
                      <Text style={styles.patientName}>{scannedPatient.name}</Text>
                      <Text style={styles.patientEmail}>{scannedPatient.email}</Text>
                      <Text style={styles.patientInfoText}>
                        {scannedPatient.bloodGroup} | {scannedPatient.phone}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => navigation.navigate('DoctorPatientProfile', { id: scannedPatient.id })}
                    >
                      <Ionicons name="person" size={24} color={colors.white} />
                      <Text style={styles.viewButtonText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.scanAgainButton}
                      onPress={resetScanner}
                    >
                      <Ionicons name="camera" size={24} color={colors.neutral[700]} />
                      <Text style={styles.scanAgainText}>Scan Again</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={64} color={colors.neutral[400]} />
                  <Text style={styles.errorTitle}>Patient Not Found</Text>
                  <TouchableOpacity
                    style={styles.scanAgainButton}
                    onPress={resetScanner}
                  >
                    <Ionicons name="camera" size={24} color={colors.neutral[700]} />
                    <Text style={styles.scanAgainText}>Scan Again</Text>
                  </TouchableOpacity>
                </View>
              )}

            </>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    padding: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 18,
    color: colors.neutral[700],
  },
  subtext: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scannerContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.success[500],
    borderRadius: 16,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.success[500],
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.success[500],
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.success[500],
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.success[500],
    borderBottomRightRadius: 16,
  },
  scannerInfo: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  scanningBar: {
    width: 64,
    height: 4,
    backgroundColor: colors.success[400],
    borderRadius: 2,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success[600],
  },
  instructionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  instructionText: {
    fontSize: 18,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 32,
  },
  foundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 8,
  },
  foundButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  successIcon: {
    width: 128,
    height: 128,
    borderRadius: 24,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 2,
    backgroundColor: colors.success[500],
    marginBottom: 32,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: 24,
    borderRadius: 16,
    gap: 16,
    marginBottom: 32,
    width: '100%',
  },
  patientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success[800],
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 4,
    fontStyle: 'italic',
  },
  patientInfoText: {
    fontSize: 16,
    color: colors.success[700],
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  settingsButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  viewButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  scanAgainText: {
    color: colors.neutral[700],
    fontSize: 20,
    fontWeight: '600',
  },
  mockScannerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  mockScannerFrame: {
    width: 300,
    height: 300,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    borderWidth: 3,
    borderColor: colors.neutral[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  mockScannerText: {
    fontSize: 18,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
})

export default DoctorQRScanner

