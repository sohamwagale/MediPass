import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { auth, db } from '../../services/firebase'
import { colors } from '../../constants/colors'

const MedicalTimeline = ({ patientId }) => {
  const navigation = useNavigation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // Use patientId from props, or fallback to current user
  const currentUserId = patientId || auth?.currentUser?.uid

  useEffect(() => {
    if (!db || !currentUserId) {
      setLoading(false)
      return
    }

    // Set up real-time listener for medical records
    const medicalRecordsRef = collection(db, 'users', currentUserId, 'medicalRecords')
    const q = query(medicalRecordsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const recordsList = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          recordsList.push({
            id: doc.id,
            diagnosis: data.diagnosis || '',
            prescription: data.prescription || null,
            dosage: data.dosage || null,
            frequency: data.frequency || null,
            duration: data.duration || null,
            instructions: data.instructions || null,
            doctorName: data.doctorName || 'Unknown Doctor',
            labReports: data.labReports || [],
            date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
            createdAt: data.createdAt,
          })
        })
        setRecords(recordsList)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading medical records:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUserId])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading medical history...</Text>
      </View>
    )
  }

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color={colors.neutral[300]} />
        <Text style={styles.emptyText}>No medical records yet</Text>
        <Text style={styles.emptySubtext}>Your medical timeline will update as doctors add records</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medical" size={32} color={colors.primary[600]} />
        <Text style={styles.title}>Medical History</Text>
      </View>

      <View style={styles.timeline}>
        {records.map((record, index) => {
          const recordDate = record.createdAt?.toDate ? record.createdAt.toDate() : new Date(record.date)
          return (
          <View key={record.id} style={styles.timelineItem}>
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
            
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('DiagnosisDetail', {
                recordId: record.id,
                patientId: currentUserId,
              })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={20} color={colors.primary[600]} />
                  <Text style={styles.date}>
                      {format(recordDate, 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.doctorContainer}>
                  <Ionicons name="person" size={16} color={colors.neutral[400]} />
                    <Text style={styles.doctor}>{record.doctorName}</Text>
                </View>
              </View>
              
              <Text style={styles.diagnosis}>{record.diagnosis}</Text>
              
                {(record.prescription || record.dosage) && (
                <View style={styles.prescriptionContainer}>
                  <Text style={styles.prescriptionLabel}>Prescription:</Text>
                    {record.prescription && (
                  <Text style={styles.prescription}>{record.prescription}</Text>
                    )}
                    {record.dosage && (
                      <Text style={styles.prescription}>Dosage: {record.dosage}</Text>
                    )}
                </View>
              )}
              
                {record.instructions && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsLabel}>Instructions:</Text>
                    <Text style={styles.instructions}>{record.instructions}</Text>
                </View>
              )}

              {record.labReports && record.labReports.length > 0 && (
                <View style={styles.labReportsBadge}>
                  <Ionicons name="document-attach" size={16} color={colors.primary[600]} />
                  <Text style={styles.labReportsText}>
                    {record.labReports.length} {record.labReports.length === 1 ? 'lab report' : 'lab reports'}
                  </Text>
                </View>
              )}

              <View style={styles.viewMoreContainer}>
                <Text style={styles.viewMoreText}>Tap to view details</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary[600]} />
              </View>
            </TouchableOpacity>
          </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    position: 'relative',
    marginLeft: 32,
    marginBottom: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: -24,
    top: 0,
    bottom: -24,
    width: 2,
    backgroundColor: colors.primary[200],
  },
  timelineDot: {
    position: 'absolute',
    left: -32,
    top: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success[600],
    borderWidth: 4,
    borderColor: colors.success[200],
    zIndex: 10,
  },
  timelineDotActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[200],
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
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  doctorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctor: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  diagnosis: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  prescriptionContainer: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  prescriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[800],
    marginBottom: 4,
  },
  prescription: {
    fontSize: 16,
    color: colors.primary[700],
  },
  instructionsContainer: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  labReportsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  labReportsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  viewMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 4,
  },
  viewMoreText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
})

export default MedicalTimeline
