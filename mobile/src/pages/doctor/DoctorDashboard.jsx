import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore'
import { auth, db } from '../../services/firebase'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const DoctorDashboard = () => {
  const navigation = useNavigation()
  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsToday: 0,
    pendingReports: 0,
    newDiagnoses: 0,
  })
  const [recentPatients, setRecentPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const doctorUid = auth?.currentUser?.uid
      if (!doctorUid || !db) {
        setLoading(false)
        return
      }

      // Load patient count
      const patientsRef = collection(db, 'doctors', doctorUid, 'patients')
      const patientsSnapshot = await getDocs(patientsRef)
      const totalPatients = patientsSnapshot.size

      // Calculate patients added today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let patientsToday = 0
      patientsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.addedAt) {
          const addedDate = data.addedAt.toDate ? data.addedAt.toDate() : new Date(data.addedAt)
          if (addedDate >= today) {
            patientsToday++
          }
        }
      })

      // Get recent patients (last 5)
      const recentPatientsList = []
      patientsSnapshot.forEach((doc) => {
        const data = doc.data()
        recentPatientsList.push({
          id: doc.id,
          patientId: data.patientId || doc.id,
          name: data.name || 'Unknown Patient',
          email: data.email || '',
          bloodGroup: data.bloodGroup || 'Unknown',
          allergies: Array.isArray(data.allergies) ? data.allergies : [],
          addedAt: data.addedAt,
        })
      })
      
      // Sort by addedAt and take first 5
      recentPatientsList.sort((a, b) => {
        const aDate = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(0)
        const bDate = b.addedAt?.toDate ? b.addedAt.toDate() : new Date(0)
        return bDate - aDate
      })
      setRecentPatients(recentPatientsList.slice(0, 5))

      // Count new diagnoses (last 24 hours) - this would require querying medical records
      // For now, we'll use a placeholder
      const newDiagnoses = 0 // TODO: Implement when medical records structure is clear

      setStats({
        totalPatients,
        patientsToday,
        pendingReports: 0, // TODO: Implement when reports system is added
        newDiagnoses,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Hero Scanner */}
        <TouchableOpacity
          style={styles.scannerCard}
          onPress={() => navigation.navigate('DoctorQRScanner')}
        >
          <View style={styles.scannerIconContainer}>
            <Ionicons name="camera" size={80} color={colors.neutral[400]} />
          </View>
          <Text style={styles.scannerTitle}>Scan Patient QR</Text>
          <Text style={styles.scannerSubtitle}>Hold any smartphone camera to scan</Text>
          <View style={styles.scannerButton}>
            <Ionicons name="medical" size={24} color={colors.white} />
            <Text style={styles.scannerButtonText}>Start Scan</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="people" size={48} color={colors.primary[600]} />
            </View>
            <Text style={styles.statNumber}>{stats.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.success[100] }]}>
              <Ionicons name="calendar" size={48} color={colors.success[600]} />
            </View>
            <Text style={styles.statNumber}>{stats.patientsToday}</Text>
            <Text style={styles.statLabel}>Added Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.neutral[200] }]}>
              <Ionicons name="medical" size={48} color={colors.neutral[700]} />
            </View>
            <Text style={styles.statNumber}>{stats.newDiagnoses}</Text>
            <Text style={styles.statLabel}>New Diagnoses</Text>
          </View>
        </View>

        {/* Recent Patients */}
        <View style={styles.patientsCard}>
          <View style={styles.patientsHeader}>
            <Ionicons name="people" size={36} color={colors.primary[600]} />
            <Text style={styles.patientsTitle}>Recent Patients</Text>
          </View>
          
          {recentPatients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No patients yet</Text>
              <Text style={styles.emptySubtext}>Scan a QR code to add your first patient</Text>
            </View>
          ) : (
          <View style={styles.patientsList}>
              {recentPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientItem}
                  onPress={() => navigation.navigate('DoctorPatientProfile', {
                    patientId: patient.patientId || patient.id,
                    patientName: patient.name,
                    patientEmail: patient.email,
                  })}
              >
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>{patient.name[0]}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientDetails}>
                      {patient.bloodGroup} {patient.allergies.length > 0 ? `| ${patient.allergies[0]}` : ''}
                  </Text>
                </View>
                <View style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  scannerCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scannerIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    borderWidth: 4,
    borderColor: colors.neutral[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  scannerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  scannerSubtitle: {
    fontSize: 20,
    color: colors.neutral[600],
    marginBottom: 32,
  },
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 12,
  },
  scannerButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 18,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  patientsCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  patientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 12,
  },
  patientsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
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
  patientsList: {
    gap: 0,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: 16,
  },
  patientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  viewButton: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[800],
  },
})

export default DoctorDashboard
