import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'

import Navbar from '../../components/common/Navbar'
import FloatingChatbotButton from '../../components/patient/FloatingChatbotButton'
import { auth, db } from '../../services/firebase'
import { colors } from '../../constants/colors'

const DEFAULT_PROFILE = {
  name: 'Patient',
  email: '',
  phone: '',
  role: 'patient',
  bloodGroup: 'Unknown',
  allergies: [],
  medicalConditions: [],
  emergencyContacts: []
}

const PatientEmergencyProfile = ({ navigation }) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !db) {
      console.warn('Firebase not initialized for PatientEmergencyProfile')
      setLoading(false)
      return
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      const ref = doc(db, 'users', user.uid)

      const unsubscribeDoc = onSnapshot(
        ref,
        async (snap) => {
        try {
          if (!snap.exists()) {
            const newProfile = {
              ...DEFAULT_PROFILE,
              name: user.displayName || 'New Patient',
              email: user.email || '',
                createdAt: serverTimestamp(),
            }

              await setDoc(ref, newProfile, { merge: true })
            setProfile(newProfile)
            setLoading(false)
            return
          }

          const data = snap.data() || {}

          setProfile({
            name: data.name || DEFAULT_PROFILE.name,
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'patient',
            bloodGroup: data.bloodGroup || 'Unknown',
            allergies: Array.isArray(data.allergies) ? data.allergies : [],
              medicalConditions: Array.isArray(data.medicalConditions)
                ? data.medicalConditions
                : [],
              emergencyContacts: Array.isArray(data.emergencyContacts)
                ? data.emergencyContacts
                : [],
          })

          setLoading(false)
        } catch (e) {
          console.error('Profile load error:', e)
          setProfile(null)
          setLoading(false)
        }
        },
        (error) => {
          console.error('onSnapshot error in PatientEmergencyProfile:', error)
          setProfile(null)
          setLoading(false)
        },
      )

      return unsubscribeDoc
    })

    return () => {
      if (typeof unsubscribeAuth === 'function') {
        unsubscribeAuth()
      }
    }
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors?.primary?.[600] || '#000'} />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color={colors?.neutral?.[400] || '#999'} />
        <Text style={styles.errorText}>Please log in to view your emergency profile</Text>
      </View>
    )
  }

  const avatarLetter = profile.name?.[0]?.toUpperCase() || 'P'

  return (
    <View style={styles.container}>
      <Navbar />

      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="warning" size={32} color={colors?.neutral?.[700] || '#333'} />
          <View>
            <Text style={styles.title}>Emergency Profile</Text>
            <Text style={styles.subtitle}>Critical medical information</Text>
          </View>
        </View>

        {/* PATIENT CARD */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <View>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.email}>{profile.email || 'No email'}</Text>
            </View>
          </View>

          <View style={styles.bloodCard}>
            <Ionicons name="water" size={26} color={colors?.primary?.[600] || '#2563EB'} />
            <Text style={styles.bloodValue}>{profile.bloodGroup}</Text>
            <Text style={styles.bloodLabel}>Blood Group</Text>
          </View>
        </View>

        {renderEmergencyContacts(profile.emergencyContacts)}
        {renderList('Allergies', 'warning', profile.allergies, colors?.neutral?.[700], 'No known allergies')}
        {renderList('Medical Conditions', 'fitness', profile.medicalConditions, colors?.error?.[600], 'No known conditions')}

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditEmergencyProfile')}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.editText}>Edit Emergency Profile</Text>
        </TouchableOpacity>
      </ScrollView>
      <FloatingChatbotButton />
    </View>
  )
}

/* ------------------ SMALL COMPONENT ------------------ */

const renderList = (title, icon, items, color, empty) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={22} color={color || '#333'} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>

    {items.length ? (
      items.map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemText}>
            {typeof item === 'string' ? item : `${item.name} — ${item.phone}`}
          </Text>
        </View>
      ))
    ) : (
      <Text style={styles.empty}>{empty}</Text>
    )}
  </View>
)

const renderEmergencyContacts = (contacts) => {
  if (!contacts || contacts.length === 0) {
    return renderList('Emergency Contacts', 'call', [], colors?.success?.[600], 'No emergency contacts')
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="call" size={22} color={colors?.success?.[600] || '#333'} />
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      </View>
      {contacts.map((contact, i) => (
        <View key={i} style={styles.contactItem}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>
              {typeof contact === 'string' ? contact : `${contact.name} — ${contact.phone}`}
            </Text>
          </View>
          {typeof contact === 'object' && contact.phone && (
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={() => {
                const phoneNumber = contact.phone.replace(/[^\d+]/g, '')
                Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
                  console.error('Error opening phone dialer:', err)
                  Alert.alert('Error', 'Unable to open phone dialer')
                })
              }}
            >
              <Ionicons name="call" size={18} color={colors?.white || '#FFF'} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  )
}

/* ------------------ STYLES ------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors?.neutral?.[50] || '#FAFAFA' },
  content: { padding: 24, gap: 24 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#666' },

  card: { backgroundColor: 'white', padding: 20, borderRadius: 20, gap: 20 },

  profileRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors?.primary?.[100] || '#DBEAFE',
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors?.primary?.[700] || '#1D4ED8' },

  name: { fontSize: 20, fontWeight: '700' },
  email: { color: '#666' },

  bloodCard: {
    backgroundColor: colors?.primary?.[50] || '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center'
  },
  bloodValue: { fontSize: 26, fontWeight: '800', marginTop: 6 },
  bloodLabel: { color: '#555' },

  section: { backgroundColor: 'white', padding: 20, borderRadius: 18, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },

  item: {
    backgroundColor: '#F4F4F5',
    padding: 14,
    borderRadius: 12
  },
  itemText: { fontSize: 15, fontWeight: '600' },
  empty: { fontStyle: 'italic', color: '#888' },
  contactItem: {
    backgroundColor: '#F4F4F5',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactText: { fontSize: 15, fontWeight: '600' },
  phoneButton: {
    backgroundColor: colors?.success?.[600] || '#10B981',
    borderRadius: 10,
    padding: 10,
    marginLeft: 12,
  },

  editBtn: {
    flexDirection: 'row',
    backgroundColor: colors?.primary?.[600] || '#2563EB',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  editText: { color: 'white', fontSize: 16, fontWeight: '700' },

  errorText: { marginTop: 12, fontSize: 16, color: '#666' }
})

export default PatientEmergencyProfile
