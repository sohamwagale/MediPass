import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { doc, getDoc } from 'firebase/firestore'
import { format } from 'date-fns'
import { db } from '../../services/firebase'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const DiagnosisDetail = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { recordId, patientId } = route.params || {}
  
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (recordId && patientId && db) {
      loadDiagnosis()
    } else {
      setLoading(false)
    }
  }, [recordId, patientId])

  const loadDiagnosis = async () => {
    try {
      const recordDocRef = doc(db, 'users', patientId, 'medicalRecords', recordId)
      const recordDoc = await getDoc(recordDocRef)
      
      if (recordDoc.exists()) {
        const data = recordDoc.data()
        setRecord({
          id: recordId,
          ...data,
        })
      } else {
        Alert.alert('Error', 'Diagnosis record not found')
        navigation.goBack()
      }
    } catch (error) {
      console.error('Error loading diagnosis:', error)
      Alert.alert('Error', 'Failed to load diagnosis details')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const handleViewLabReport = async (labReport) => {
    if (labReport.url) {
      try {
        const supported = await Linking.canOpenURL(labReport.url)
        if (supported) {
          await Linking.openURL(labReport.url)
        } else {
          Alert.alert('Error', 'Cannot open this file')
        }
      } catch (error) {
        console.error('Error opening lab report:', error)
        Alert.alert('Error', 'Failed to open lab report')
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading diagnosis...</Text>
        </View>
      </View>
    )
  }

  if (!record) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color={colors.neutral[400]} />
          <Text style={styles.errorText}>Diagnosis not found</Text>
        </View>
      </View>
    )
  }

  const recordDate = record.createdAt?.toDate ? record.createdAt.toDate() : new Date(record.date || Date.now())

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="medical" size={32} color={colors.primary[600]} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Diagnosis Details</Text>
            <Text style={styles.subtitle}>
              {format(recordDate, 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>

        {/* Diagnosis Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color={colors.primary[600]} />
            <Text style={styles.cardTitle}>Diagnosis</Text>
          </View>
          <Text style={styles.diagnosisText}>{record.diagnosis || 'No diagnosis provided'}</Text>
        </View>

        {/* Doctor Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={colors.neutral[700]} />
            <Text style={styles.cardTitle}>Doctor</Text>
          </View>
          <Text style={styles.doctorName}>{record.doctorName || 'Unknown Doctor'}</Text>
        </View>

        {/* Prescription Section */}
        {(record.prescription || record.dosage || record.frequency || record.duration) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="medkit" size={24} color={colors.success[600]} />
              <Text style={styles.cardTitle}>Prescription</Text>
            </View>
            {record.prescription && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Medication:</Text>
                <Text style={styles.infoValue}>{record.prescription}</Text>
              </View>
            )}
            {record.dosage && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dosage:</Text>
                <Text style={styles.infoValue}>{record.dosage}</Text>
              </View>
            )}
            {record.frequency && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Frequency:</Text>
                <Text style={styles.infoValue}>{record.frequency}</Text>
              </View>
            )}
            {record.duration && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{record.duration}</Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        {record.instructions && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={24} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>{record.instructions}</Text>
          </View>
        )}

        {/* Lab Reports */}
        {record.labReports && record.labReports.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-attach" size={24} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Lab Reports</Text>
            </View>
            <Text style={styles.sectionDescription}>
              {record.labReports.length} {record.labReports.length === 1 ? 'report' : 'reports'} attached
            </Text>
            <View style={styles.labReportsList}>
              {record.labReports.map((labReport, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.labReportItem}
                  onPress={() => handleViewLabReport(labReport)}
                >
                  <View style={styles.labReportIcon}>
                    <Ionicons name="document" size={24} color={colors.primary[600]} />
                  </View>
                  <View style={styles.labReportInfo}>
                    <Text style={styles.labReportName} numberOfLines={1}>
                      {labReport.name || `Lab Report ${index + 1}`}
                    </Text>
                    <Text style={styles.labReportSubtext}>Tap to view</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {(!record.labReports || record.labReports.length === 0) && (
          <View style={styles.emptyCard}>
            <Ionicons name="document-outline" size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>No lab reports attached</Text>
          </View>
        )}
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
    gap: 20,
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
  errorText: {
    fontSize: 18,
    color: colors.neutral[600],
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  diagnosisText: {
    fontSize: 18,
    color: colors.neutral[700],
    lineHeight: 26,
  },
  doctorName: {
    fontSize: 16,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: colors.neutral[900],
    flex: 1,
  },
  instructionsText: {
    fontSize: 16,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 16,
  },
  labReportsList: {
    gap: 12,
  },
  labReportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  labReportIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  labReportInfo: {
    flex: 1,
  },
  labReportName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  labReportSubtext: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral[600],
  },
})

export default DiagnosisDetail
