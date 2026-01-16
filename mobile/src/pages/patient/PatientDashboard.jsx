import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { auth, db } from '../../services/firebase'
import { useAuthStore } from '../../stores/authStore'
import PatientQR from '../../components/patient/PatientQR'
import MedicalTimeline from '../../components/common/MedicalTimeline'
import Navbar from '../../components/common/Navbar'
import FloatingChatbotButton from '../../components/patient/FloatingChatbotButton'
import { colors } from '../../constants/colors'

// Safe import with fallback for LinearGradient
let LinearGradient = null
try {
  const gradientModule = require('expo-linear-gradient')
  LinearGradient = gradientModule.LinearGradient
} catch (error) {
  console.warn('expo-linear-gradient not available, using fallback')
  LinearGradient = ({ children, style, colors: _colors, ...props }) => (
    <View style={[{ backgroundColor: _colors?.[0] || colors.white }, style]} {...props}>
      {children}
    </View>
  )
}

const PatientDashboard = () => {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const [prescriptions, setPrescriptions] = useState([])
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const patientUid = auth?.currentUser?.uid || user?.uid || user?.id
    if (!patientUid || !db) {
      setLoading(false)
      return
    }

    // Load patient data
    const loadPatientData = async () => {
      try {
        const { doc, getDoc } = require('firebase/firestore')
        const patientDocRef = doc(db, 'users', patientUid)
        const patientDoc = await getDoc(patientDocRef)
        
        if (patientDoc.exists()) {
          const data = patientDoc.data()
          setPatientData({
            allergies: Array.isArray(data.allergies) ? data.allergies : [],
            bloodGroup: data.bloodGroup || 'Unknown',
          })
        }
      } catch (error) {
        console.error('Error loading patient data:', error)
      }
    }

    loadPatientData()

    // Set up real-time listener for prescriptions
    const prescriptionsRef = collection(db, 'users', patientUid, 'prescriptions')
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'))

    const unsubscribePrescriptions = onSnapshot(
      q,
      (querySnapshot) => {
        const prescriptionsList = []
        querySnapshot.forEach((doc) => {
          prescriptionsList.push({
            id: doc.id,
            ...doc.data(),
          })
        })
        setPrescriptions(prescriptionsList)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading prescriptions:', error)
        setLoading(false)
      }
    )

    return () => {
      unsubscribePrescriptions()
    }
  }, [user])

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

  const patientName = user?.name || 'Patient'
  const allergiesCount = patientData?.allergies?.length || 0

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content}>
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.primary[500], colors.success[500]]}
            style={styles.badge}
          >
            <Ionicons name="heart" size={20} color={colors.white} />
            <Text style={styles.badgeText}>Your Health Records, Always Accessible</Text>
          </LinearGradient>
          <Text style={styles.title}>Welcome Back, {patientName}</Text>
        </View>

        <View style={styles.grid}>
          <PatientQR />
          
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('PatientPrescriptions')}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.success[100] }]}>
                <Ionicons name="medical" size={40} color={colors.success[600]} />
              </View>
              <Text style={styles.statNumber}>{prescriptions.length}</Text>
              <Text style={styles.statLabel}>Active Prescriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('PatientEmergencyProfile')}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.neutral[200] }]}>
                <Ionicons name="warning" size={40} color={colors.neutral[700]} />
              </View>
              <Text style={styles.statNumber}>{allergiesCount}</Text>
              <Text style={styles.statLabel}>Known Allergies</Text>
            </TouchableOpacity>
          </View>
        </View>

        <MedicalTimeline />
      </ScrollView>
      <FloatingChatbotButton />
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
  loadingText: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 24,
    gap: 8,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  grid: {
    gap: 24,
    marginBottom: 32,
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
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
  },
})

export default PatientDashboard
