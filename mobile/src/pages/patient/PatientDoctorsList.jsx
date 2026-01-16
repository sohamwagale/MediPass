import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../services/firebase'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const PatientDoctorsList = () => {
  const navigation = useNavigation()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const patientUid = auth?.currentUser?.uid
    if (!patientUid || !db) {
      setLoading(false)
      return
    }

    // Set up real-time listener for doctors
    const doctorsRef = collection(db, 'users', patientUid, 'doctors')
    
    const unsubscribe = onSnapshot(
      doctorsRef,
      async (querySnapshot) => {
        const doctorPromises = []
        querySnapshot.forEach((docSnapshot) => {
          const doctorData = docSnapshot.data()
          const doctorId = doctorData.doctorId || docSnapshot.id
          
          // Fetch doctor details
          const doctorPromise = (async () => {
            try {
              const doctorDocRef = doc(db, 'users', doctorId)
              const doctorDoc = await getDoc(doctorDocRef)
              
              if (doctorDoc.exists()) {
                const doctorInfo = doctorDoc.data()
                return {
                  id: doctorId,
                  name: doctorInfo.name || 'Unknown Doctor',
                  email: doctorInfo.email || '',
                  specialization: doctorInfo.specialization || '',
                  hospital: doctorInfo.hospital || '',
                  phone: doctorInfo.phone || '',
                  addedAt: doctorData.addedAt,
                }
              } else {
                return {
                  id: doctorId,
                  name: 'Unknown Doctor',
                  email: '',
                  specialization: '',
                  hospital: '',
                  phone: '',
                  addedAt: doctorData.addedAt,
                }
              }
            } catch (error) {
              console.error('Error fetching doctor details:', error)
              return {
                id: doctorId,
                name: 'Unknown Doctor',
                email: '',
                specialization: '',
                hospital: '',
                phone: '',
                addedAt: doctorData.addedAt,
              }
            }
          })()
          
          doctorPromises.push(doctorPromise)
        })
        
        // Wait for all promises to resolve
        const doctorsList = await Promise.all(doctorPromises)
        setDoctors(doctorsList)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading doctors:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={32} color={colors.primary[600]} />
          </View>
          <View>
            <Text style={styles.title}>My Doctors</Text>
            <Text style={styles.subtitle}>
              {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} total
            </Text>
          </View>
        </View>

        {doctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={80} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No Doctors Yet</Text>
            <Text style={styles.emptyText}>
              Doctors will appear here after they scan your QR code and accept you as a patient
            </Text>
          </View>
        ) : (
          <View style={styles.doctorsList}>
            {doctors.map((doctor) => {
              const avatarLetter = (doctor.name || 'D')[0].toUpperCase()
              return (
                <TouchableOpacity
                  key={doctor.id}
                  style={styles.doctorCard}
                  onPress={() => navigation.navigate('PatientDoctorProfile', { doctorId: doctor.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorAvatarText}>{avatarLetter}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    {doctor.specialization && (
                      <Text style={styles.doctorSpecialization}>{doctor.specialization}</Text>
                    )}
                    {doctor.hospital && (
                      <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
                    )}
                    {doctor.email && (
                      <Text style={styles.doctorEmail}>{doctor.email}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.neutral[400]} />
                </TouchableOpacity>
              )
            })}
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
    marginBottom: 32,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[700],
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  doctorsList: {
    gap: 16,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 2,
  },
  doctorHospital: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 2,
  },
  doctorEmail: {
    fontSize: 14,
    color: colors.neutral[500],
  },
})

export default PatientDoctorsList
