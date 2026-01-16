import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'
import { auth, db } from '../../services/firebase'
import { cancelMedicationReminders } from '../../services/notificationService'

const PatientPrescriptions = () => {
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    const user = auth?.currentUser
    if (!db || !user) {
      setPrescriptions([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'prescriptions'),
      orderBy('createdAt', 'desc'),
    )

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        
        // Auto-complete medications that have passed their end date
        const now = new Date()
        for (const prescription of rows) {
          if (!prescription.isCompleted && prescription.endDate) {
            let endDate
            if (prescription.endDate?.toDate) {
              endDate = prescription.endDate.toDate()
            } else if (prescription.endDate instanceof Date) {
              endDate = prescription.endDate
            } else if (typeof prescription.endDate === 'string') {
              endDate = new Date(prescription.endDate)
            } else {
              continue
            }

            // If end date has passed, mark as completed
            if (endDate < now) {
              try {
                const prescriptionRef = doc(db, 'users', user.uid, 'prescriptions', prescription.id)
                await updateDoc(prescriptionRef, {
                  isCompleted: true,
                  completedAt: new Date(),
                })
                
                // Cancel medication reminders
                await cancelMedicationReminders(prescription.id)
                console.log(`✅ Auto-completed medication: ${prescription.name}`)
              } catch (error) {
                console.error('Error auto-completing prescription:', error)
              }
            }
          }
        }
        
        setPrescriptions(rows)
        setLoading(false)
      },
      (error) => {
        console.error('Prescription subscription error:', error)
        setPrescriptions([])
        setLoading(false)
      },
    )

    return () => unsub()
  }, [])

  const handleMarkComplete = async (prescriptionId, isCompleted) => {
    try {
      const user = auth?.currentUser
      if (!user || !db) return

      const prescriptionRef = doc(db, 'users', user.uid, 'prescriptions', prescriptionId)
      const newCompletedStatus = !isCompleted
      
      await updateDoc(prescriptionRef, {
        isCompleted: newCompletedStatus,
        completedAt: newCompletedStatus ? new Date() : null,
      })

      // If marking as completed, cancel medication reminders
      if (newCompletedStatus) {
        try {
          await cancelMedicationReminders(prescriptionId)
        } catch (error) {
          console.error('Error canceling medication reminders:', error)
          // Don't show error to user, just log it
        }
      }
    } catch (error) {
      console.error('Error updating prescription:', error)
      Alert.alert('Error', 'Failed to update prescription status')
    }
  }

  const { activePrescriptions, completedPrescriptions } = useMemo(() => {
    const active = []
    const completed = []

    prescriptions.forEach((p) => {
      const createdAtDate =
        p.createdAt && typeof p.createdAt?.toDate === 'function'
          ? p.createdAt.toDate()
          : null
      const timeText = createdAtDate ? format(createdAtDate, 'dd MMM yyyy, HH:mm') : '—'

      const completedAtDate =
        p.completedAt && typeof p.completedAt?.toDate === 'function'
          ? p.completedAt.toDate()
          : null
      const completedTimeText = completedAtDate ? format(completedAtDate, 'dd MMM yyyy') : null

      const card = {
        ...p,
        timeText,
        completedTimeText,
      }

      if (p.isCompleted) {
        completed.push(card)
      } else {
        active.push(card)
      }
    })

    return { activePrescriptions: active, completedPrescriptions: completed }
  }, [prescriptions])

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={32} color={colors.success[600]} />
          </View>
          <View>
            <Text style={styles.title}>Prescriptions</Text>
            <Text style={styles.subtitle}>Medication schedule and reminders</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.loadingText}>Loading prescriptions...</Text>
            </View>
          ) : activePrescriptions.length === 0 && completedPrescriptions.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={64} color={colors.neutral[400]} />
              <Text style={styles.emptyTitle}>No prescriptions yet</Text>
              <Text style={styles.emptySubtitle}>
                Ask your doctor to scan your QR code and add prescriptions.
              </Text>
            </View>
          ) : (
            <>
              {/* Active Prescriptions */}
              {activePrescriptions.length > 0 && (
                <>
                  {activePrescriptions.map((prescription) => (
            <View key={prescription.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{prescription.name}</Text>
                        <View
                          style={[
                            styles.refillBadge,
                            prescription.refills > 0 ? styles.refillBadgeActive : styles.refillBadgeWarning,
                          ]}
                        >
                          <Text style={styles.refillText}>{prescription.refills ?? 0} refills</Text>
                </View>
              </View>
              
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dosage:</Text>
                          <Text style={styles.detailValue}>{prescription.dosage || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Frequency:</Text>
                          <Text style={styles.detailValue}>{prescription.frequency || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                          <Text style={styles.detailValue}>{prescription.duration || '—'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Prescribed:</Text>
                          <Text style={styles.detailValue}>{prescription.timeText}</Text>
                </View>
              </View>

              <View style={styles.instructionsContainer}>
                        <Text style={styles.instructions}>{prescription.instructions || '—'}</Text>
              </View>

              <View style={styles.footer}>
                <View style={styles.timeContainer}>
                  <Ionicons name="time" size={20} color={colors.primary[600]} />
                          <Text style={styles.timeText}>{prescription.doctorName ? `Dr. ${prescription.doctorName}` : 'Doctor'}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleMarkComplete(prescription.id, prescription.isCompleted)}
                          style={styles.completeButton}
                        >
                          <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary[600]} />
                          <Text style={styles.completeButtonText}>Mark Complete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Completed Prescriptions - Minimized Section */}
              {completedPrescriptions.length > 0 && (
                <View style={styles.completedSection}>
                  <View style={styles.completedHeader}>
                    <Ionicons name="checkmark-done-circle" size={24} color={colors.neutral[500]} />
                    <Text style={styles.completedTitle}>Completed Medications ({completedPrescriptions.length})</Text>
                  </View>
                  <View style={styles.completedList}>
                    {completedPrescriptions.map((prescription) => (
                      <View key={prescription.id} style={styles.completedCard}>
                        <View style={styles.completedCardContent}>
                          <View style={styles.completedCardLeft}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} />
                            <View style={styles.completedCardInfo}>
                              <Text style={styles.completedCardName}>{prescription.name}</Text>
                              {prescription.completedTimeText && (
                                <Text style={styles.completedCardDate}>Completed on {prescription.completedTimeText}</Text>
                              )}
                            </View>
                </View>
                          <TouchableOpacity
                            onPress={() => handleMarkComplete(prescription.id, prescription.isCompleted)}
                            style={styles.undoButton}
                          >
                            <Ionicons name="arrow-undo" size={18} color={colors.primary[600]} />
                          </TouchableOpacity>
              </View>
            </View>
          ))}
                  </View>
                </View>
              )}
            </>
          )}
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
    gap: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  grid: {
    gap: 24,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: colors.neutral[600],
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    flex: 1,
  },
  refillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  refillBadgeActive: {
    backgroundColor: colors.success[100],
  },
  refillBadgeWarning: {
    backgroundColor: colors.neutral[200],
  },
  refillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success[800],
  },
  details: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
    marginRight: 8,
  },
  detailValue: {
    fontSize: 16,
    color: colors.neutral[700],
  },
  instructionsContainer: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    color: colors.primary[800],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[600],
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  completedSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  completedList: {
    gap: 12,
  },
  completedCard: {
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 12,
    opacity: 0.7,
  },
  completedCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  completedCardInfo: {
    flex: 1,
  },
  completedCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
    textDecorationLine: 'line-through',
  },
  completedCardDate: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  undoButton: {
    padding: 6,
  },
})

export default PatientPrescriptions

