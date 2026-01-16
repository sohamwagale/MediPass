import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const PatientDoctorProfile = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { doctorId } = route.params || {}

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!doctorId || !db) {
      setLoading(false)
      return
    }

    const fetchDoctor = async () => {
      try {
        const doctorDocRef = doc(db, 'users', doctorId)
        const doctorDoc = await getDoc(doctorDocRef)

        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data()
          setDoctor({
            id: doctorId,
            ...doctorData,
          })
        } else {
          Alert.alert('Error', 'Doctor profile not found')
          navigation.goBack()
        }
      } catch (error) {
        console.error('Error fetching doctor profile:', error)
        Alert.alert('Error', 'Failed to load doctor profile')
        navigation.goBack()
      } finally {
        setLoading(false)
      }
    }

    fetchDoctor()
  }, [doctorId, navigation])

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not available')
      return
    }
    const phoneNumber = phone.replace(/[^\d+]/g, '')
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      console.error('Error opening phone dialer:', err)
      Alert.alert('Error', 'Unable to open phone dialer')
    })
  }

  const handleEmail = (email) => {
    if (!email) {
      Alert.alert('Error', 'Email not available')
      return
    }
    Linking.openURL(`mailto:${email}`).catch((err) => {
      console.error('Error opening email client:', err)
      Alert.alert('Error', 'Unable to open email client')
    })
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading doctor profile...</Text>
        </View>
      </View>
    )
  }

  if (!doctor) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={80} color={colors.neutral[400]} />
          <Text style={styles.errorText}>Doctor profile not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const avatarLetter = (doctor.name || 'D')[0].toUpperCase()

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            {doctor.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{doctor.name || 'Unknown Doctor'}</Text>
          {doctor.specialization && (
            <Text style={styles.specialization}>{doctor.specialization}</Text>
          )}
          {doctor.hospital && (
            <Text style={styles.hospital}>{doctor.hospital}</Text>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={24} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          {doctor.email && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleEmail(doctor.email)}
            >
              <View style={styles.contactLeft}>
                <Ionicons name="mail" size={20} color={colors.primary[600]} />
                <Text style={styles.contactLabel}>Email</Text>
              </View>
              <View style={styles.contactRight}>
                <Text style={styles.contactValue}>{doctor.email}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          )}

          {doctor.phone && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleCall(doctor.phone)}
            >
              <View style={styles.contactLeft}>
                <Ionicons name="call" size={20} color={colors.success[600]} />
                <Text style={styles.contactLabel}>Phone</Text>
              </View>
              <View style={styles.contactRight}>
                <Text style={styles.contactValue}>{doctor.phone}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={24} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Professional Information</Text>
          </View>

          {doctor.licenseNumber && (
            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Ionicons name="document-text" size={20} color={colors.primary[600]} />
                <Text style={styles.infoLabel}>License Number</Text>
              </View>
              <Text style={styles.infoValue}>{doctor.licenseNumber}</Text>
            </View>
          )}

          {doctor.specialization && (
            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Ionicons name="star" size={20} color={colors.primary[600]} />
                <Text style={styles.infoLabel}>Specialization</Text>
              </View>
              <Text style={styles.infoValue}>{doctor.specialization}</Text>
            </View>
          )}

          {doctor.hospital && (
            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Ionicons name="business" size={20} color={colors.primary[600]} />
                <Text style={styles.infoLabel}>Hospital/Clinic</Text>
              </View>
              <Text style={styles.infoValue}>{doctor.hospital}</Text>
            </View>
          )}
        </View>

        {/* License Certificate */}
        {doctor.licenseCertificateURL && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success[600]} />
              <Text style={styles.sectionTitle}>License Certificate</Text>
            </View>
            <TouchableOpacity
              style={styles.certificateContainer}
              onPress={() => {
                if (doctor.licenseCertificateURL) {
                  Linking.openURL(doctor.licenseCertificateURL).catch((err) => {
                    console.error('Error opening certificate:', err)
                    Alert.alert('Error', 'Unable to open certificate')
                  })
                }
              }}
            >
              <View style={styles.certificateContent}>
                <Ionicons name="document" size={32} color={colors.primary[600]} />
                <Text style={styles.certificateText}>View License Certificate</Text>
                <Ionicons name="open-outline" size={20} color={colors.primary[600]} />
              </View>
            </TouchableOpacity>
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
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: colors.white,
    fontSize: 48,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.success[200],
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success[700],
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 4,
    textAlign: 'center',
  },
  specialization: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 4,
    textAlign: 'center',
  },
  hospital: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  contactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  contactValue: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'right',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  infoValue: {
    fontSize: 14,
    color: colors.neutral[600],
    flex: 1,
    textAlign: 'right',
  },
  certificateContainer: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },
  certificateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  certificateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[700],
  },
})

export default PatientDoctorProfile
