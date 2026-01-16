import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import DateTimePicker from '@react-native-community/datetimepicker'

import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'
import { auth, db } from '../../services/firebase'
import { useAuthStore } from '../../stores/authStore'
import { scheduleMedicationReminder } from '../../services/notificationService'


const DoctorPrescribeMedication = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { user: doctorUser } = useAuthStore()

  const { patientId, patientName, patientEmail } = route.params || {}

  const patientLabel = useMemo(() => {
    if (patientName || patientEmail) return `${patientName || 'Patient'} (${patientEmail || ''})`
    return patientId || 'Patient'
  }, [patientEmail, patientId, patientName])

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const calculateDuration = (start, end) => {
    if (!start || !end) return ''
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
  }

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    instructions: '',
    refills: '0',
    startDate: new Date(),
    endDate: new Date(),
  })
  const [saving, setSaving] = useState(false)

  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)


  const savePrescription = async () => {
    if (!patientId) {
      Alert.alert('Error', 'Missing patient information')
      return
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Medication name is required')
      return
    }

    try {
      setSaving(true)

      const doctorUid = auth?.currentUser?.uid
      if (!db || !doctorUid) {
        Alert.alert('Error', 'Doctor not logged in')
        return
      }

      const refillsNum = Number.parseInt(formData.refills || '0', 10)
      const duration = calculateDuration(formData.startDate, formData.endDate)

      const payload = {
        name: formData.name.trim(),
        dosage: (formData.dosage || '').trim(),
        frequency: (formData.frequency || '').trim(),
        duration: duration,
        instructions: (formData.instructions || '').trim(),
        refills: Number.isFinite(refillsNum) ? refillsNum : 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        patientId,
        patientName: patientName || '',
        patientEmail: patientEmail || '',
        doctorId: doctorUid,
        doctorName: doctorUser?.name || '',
        createdAt: serverTimestamp(),
      }

      const prescriptionRef = await addDoc(collection(db, 'users', patientId, 'prescriptions'), payload)
      const prescriptionId = prescriptionRef.id

      // Schedule medication reminders
      try {
        await scheduleMedicationReminder(
          prescriptionId,
          payload.name,
          payload.dosage,
          payload.frequency,
          new Date(payload.startDate),
          new Date(payload.endDate),
          {
            prescriptionId,
            patientId,
            doctorName: payload.doctorName,
          }
        )
        console.log('✅ Medication reminders scheduled')
      } catch (error) {
        console.error('Error scheduling medication reminders:', error)
        // Don't block the flow if reminder scheduling fails
      }

      Alert.alert('Success', 'Prescription added')
      navigation.goBack()
    } catch (error) {
      console.error('Prescribe medication error:', error)
      Alert.alert('Error', error?.message || 'Failed to save prescription')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Prescribe Medication</Text>
        <Text style={styles.subtitle}>For: {patientLabel}</Text>

        <View style={styles.card}>
          <Field
            label="Medication Name *"
            icon="medkit"
            value={formData.name}
            placeholder="e.g. Amlodipine"
            onChangeText={(t) => setFormData({ ...formData, name: t })}
          />
          <Field
            label="Dosage"
            icon="flask"
            value={formData.dosage}
            placeholder="e.g. 5mg"
            onChangeText={(t) => setFormData({ ...formData, dosage: t })}
          />
          <Field
            label="Frequency"
            icon="time"
            value={formData.frequency}
            placeholder="e.g. 1 tablet daily"
            onChangeText={(t) => setFormData({ ...formData, frequency: t })}
          />
          {/* <Field
            label="Duration"
            icon="calendar"
            value={formData.duration}
            placeholder="e.g. 30 days"
            onChangeText={(t) => setFormData({ ...formData, duration: t })}
          /> */}
          <Field
            label="Instructions"
            icon="document-text"
            value={formData.instructions}
            placeholder="e.g. Take in the morning with water"
            onChangeText={(t) => setFormData({ ...formData, instructions: t })}
            multiline
          />

          {/* Start Date */}
          <View style={styles.dateFieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="calendar" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Start Date</Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              activeOpacity={0.7}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(formData.startDate) || 'Select start date'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View style={styles.dateFieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="calendar" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>End Date</Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              activeOpacity={0.7}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(formData.endDate) || 'Select end date'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* Duration Display */}
          {formData.startDate && formData.endDate && (
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={16} color={colors.primary[600]} />
              <Text style={styles.durationText}>
                Duration: {calculateDuration(formData.startDate, formData.endDate)}
              </Text>
            </View>
          )}

          {/* Date Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={formData.startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowStartPicker(false)
                }
                if (event.type === 'set' && selectedDate) {
                  setFormData({ ...formData, startDate: selectedDate })
                  // If end date is before new start date, update it
                  if (formData.endDate < selectedDate) {
                    setFormData((prev) => ({ ...prev, startDate: selectedDate, endDate: selectedDate }))
                  }
                } else if (Platform.OS === 'android' && event.type === 'dismissed') {
                  setShowStartPicker(false)
                }
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={formData.endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={formData.startDate || new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowEndPicker(false)
                }
                if (event.type === 'set' && selectedDate) {
                  setFormData({ ...formData, endDate: selectedDate })
                } else if (Platform.OS === 'android' && event.type === 'dismissed') {
                  setShowEndPicker(false)
                }
              }}
            />
          )}

          {/* iOS Date Picker Close Button */}
          {Platform.OS === 'ios' && (showStartPicker || showEndPicker) && (
            <TouchableOpacity
              style={styles.closePickerButton}
              onPress={() => {
                setShowStartPicker(false)
                setShowEndPicker(false)
              }}
            >
              <Text style={styles.closePickerButtonText}>Done</Text>
            </TouchableOpacity>
          )}
          <Field
            label="Refills"
            icon="refresh"
            value={formData.refills}
            placeholder="0"
            onChangeText={(t) => setFormData({ ...formData, refills: t })}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={savePrescription}
            disabled={saving}
          >
            <Ionicons name="save" size={20} color={colors.white} />
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Prescription'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const Field = ({
  label,
  icon,
  value,
  placeholder,
  onChangeText,
  multiline,
  keyboardType,
  editable = true,
}) => (
  <View style={styles.inputGroup}>
    <View style={styles.labelRow}>
      <Ionicons name={icon} size={16} color={colors.neutral[700]} />
      <Text style={styles.label}>{label}</Text>
    </View>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      editable={editable}
    />
  </View>
)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { padding: 24, paddingBottom: 40, gap: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.neutral[900] },
  subtitle: { fontSize: 14, color: colors.neutral[600], marginBottom: 8 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  inputGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.neutral[700] },
  input: {
    backgroundColor: '#F4F4F5',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: colors.neutral[900],
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  inputDisabled: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[500],
  },
  dateFieldContainer: {
    gap: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F4F5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.neutral[900],
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  closePickerButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    alignItems: 'center',
  },
  closePickerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})

export default DoctorPrescribeMedication

