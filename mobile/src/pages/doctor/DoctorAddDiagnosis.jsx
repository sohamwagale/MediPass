import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
// Try to import expo-document-picker, fallback if not available
let DocumentPicker = null
try {
  DocumentPicker = require('expo-document-picker')
} catch (error) {
  console.warn('expo-document-picker not available. Install it with: npx expo install expo-document-picker')
}
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../../services/firebase'
import { sendDiagnosisNotification } from '../../services/notificationService'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const DoctorAddDiagnosis = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { patientId, patientName: routePatientName } = route.params || {}
  
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [labReports, setLabReports] = useState([])
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    prescription: '',
    dosage: '',
    frequency: '',
    duration: '',
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
          name: patientData.name || routePatientName || 'Unknown Patient',
        })
      } else {
        setPatient({
          id: patientId,
          name: routePatientName || 'Unknown Patient',
        })
      }
    } catch (error) {
      console.error('Error loading patient:', error)
      setPatient({
        id: patientId,
        name: routePatientName || 'Unknown Patient',
      })
    } finally {
      setLoading(false)
    }
  }

  const pickLabReport = async () => {
    if (!DocumentPicker) {
      Alert.alert(
        'Document Picker Not Available',
        'Please install expo-document-picker:\nnpx expo install expo-document-picker'
      )
      return
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        setLabReports([...labReports, {
          name: file.name,
          uri: file.uri,
          mimeType: file.mimeType,
        }])
      }
    } catch (error) {
      console.error('Error picking document:', error)
      Alert.alert('Error', 'Failed to pick document')
    }
  }

  const removeLabReport = (index) => {
    const newReports = labReports.filter((_, i) => i !== index)
    setLabReports(newReports)
  }

  const uploadLabReports = async (medicalRecordId) => {
    if (labReports.length === 0) return []

    const uploadedUrls = []
    setUploading(true)

    try {
      for (const report of labReports) {
        const fileName = `${medicalRecordId}_${Date.now()}_${report.name}`
        const storageRef = ref(storage, `medicalRecords/${patientId}/${fileName}`)
        
        // Convert URI to blob
        const response = await fetch(report.uri)
        const blob = await response.blob()
        
        await uploadBytes(storageRef, blob)
        const downloadURL = await getDownloadURL(storageRef)
        uploadedUrls.push({
          name: report.name,
          url: downloadURL,
        })
      }
    } catch (error) {
      console.error('Error uploading lab reports:', error)
      throw error
    } finally {
      setUploading(false)
    }

    return uploadedUrls
  }

  const handleSubmit = async () => {
    if (!formData.diagnosis.trim()) {
      Alert.alert('Error', 'Please enter a diagnosis')
      return
    }

    if (!db || !auth?.currentUser || !patientId) {
      Alert.alert('Error', 'Unable to save. Please check your connection.')
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
      const medicalRecordRef = await addDoc(medicalRecordsRef, {
        diagnosis: formData.diagnosis.trim(),
        prescription: formData.prescription.trim() || null,
        dosage: formData.dosage.trim() || null,
        frequency: formData.frequency.trim() || null,
        duration: formData.duration.trim() || null,
        instructions: formData.instructions.trim() || null,
        doctorId: doctorUid,
        doctorName: doctorName,
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
        labReports: [], // Will be updated after upload
      })

      // Upload lab reports if any
      let labReportUrls = []
      if (labReports.length > 0) {
        try {
          labReportUrls = await uploadLabReports(medicalRecordRef.id)
          // Update the medical record with lab report URLs
          await updateDoc(medicalRecordRef, {
            labReports: labReportUrls,
          })
        } catch (error) {
          console.error('Error uploading lab reports:', error)
          Alert.alert('Warning', 'Diagnosis saved but lab reports failed to upload')
        }
      }

      // Send notification to patient
      try {
        await sendDiagnosisNotification(patientId, doctorName, formData.diagnosis.trim())
      } catch (error) {
        console.error('Error sending diagnosis notification:', error)
        // Don't block the flow if notification fails
      }

    Alert.alert('Success', 'Diagnosis saved successfully!', [
      {
        text: 'OK',
          onPress: () => {
            navigation.navigate('DoctorPatientProfile', {
              patientId: patientId,
              patientName: patient?.name || routePatientName,
            })
          }
      }
    ])
    } catch (error) {
      console.error('Error saving diagnosis:', error)
      Alert.alert('Error', 'Failed to save diagnosis. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patient?.name?.[0]?.toUpperCase() || 'P'}</Text>
          </View>
          <View>
            <Text style={styles.title}>Add Diagnosis</Text>
            <Text style={styles.subtitle}>For {patient?.name || 'Patient'}</Text>
          </View>
        </View>

        <View style={styles.form}>
            {/* Diagnosis */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="medical" size={24} color={colors.primary[600]} />
              <Text style={styles.label}>Diagnosis *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.diagnosis}
                onChangeText={(text) => setFormData({...formData, diagnosis: text})}
                placeholder="Enter diagnosis details..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

          {/* Prescription Section (Optional) */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Prescription (Optional)</Text>
          </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
              <Ionicons name="medkit" size={20} color={colors.success[600]} />
              <Text style={styles.label}>Medication Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.prescription}
                onChangeText={(text) => setFormData({...formData, prescription: text})}
              placeholder="e.g. Amlodipine"
              />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.sublabel}>Dosage</Text>
              <TextInput
                style={styles.input}
                value={formData.dosage}
                onChangeText={(text) => setFormData({...formData, dosage: text})}
                placeholder="e.g. 5mg"
              />
            </View>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.sublabel}>Frequency</Text>
              <TextInput
                style={styles.input}
                value={formData.frequency}
                onChangeText={(text) => setFormData({...formData, frequency: text})}
                placeholder="e.g. Daily"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.sublabel}>Duration</Text>
            <TextInput
              style={styles.input}
              value={formData.duration}
              onChangeText={(text) => setFormData({...formData, duration: text})}
              placeholder="e.g. 30 days"
            />
          </View>

          {/* Instructions */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="document-text" size={24} color={colors.neutral[700]} />
              <Text style={styles.label}>Instructions (Optional)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.instructions}
              onChangeText={(text) => setFormData({...formData, instructions: text})}
              placeholder="Special instructions to patient..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Lab Reports */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="document-attach" size={24} color={colors.primary[600]} />
              <Text style={styles.label}>Lab Reports (Optional)</Text>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickLabReport}
              disabled={uploading}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary[600]} />
              <Text style={styles.uploadButtonText}>Add Lab Report</Text>
            </TouchableOpacity>
            
            {labReports.length > 0 && (
              <View style={styles.reportsList}>
                {labReports.map((report, index) => (
                  <View key={index} style={styles.reportItem}>
                    <Ionicons name="document" size={20} color={colors.primary[600]} />
                    <Text style={styles.reportName} numberOfLines={1}>{report.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeLabReport(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error[600]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={saving || uploading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (saving || uploading) && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving || uploading}
            >
              {saving || uploading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color={colors.white} />
              <Text style={styles.saveButtonText}>Save Diagnosis</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  contentContainer: {
    padding: 24,
    gap: 24,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: 20,
    color: colors.neutral[600],
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    gap: 20,
  },
  sectionDivider: {
    marginTop: 8,
    marginBottom: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  inputGroup: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  sublabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.neutral[900],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.primary[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.primary[50],
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  reportsList: {
    gap: 8,
    marginTop: 8,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[50],
    padding: 12,
    borderRadius: 12,
  },
  reportName: {
    flex: 1,
    fontSize: 14,
    color: colors.neutral[700],
  },
  removeButton: {
    padding: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})

export default DoctorAddDiagnosis
