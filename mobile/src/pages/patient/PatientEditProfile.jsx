import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { doc, setDoc } from 'firebase/firestore'

import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { auth, db } from '../../services/firebase'

const PatientEditProfile = () => {
  const { user } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }

    try {
      setSaving(true)
      const currentUser = auth?.currentUser

      if (!currentUser || !db) {
        Alert.alert('Error', 'User not logged in')
        return
      }

      const ref = doc(db, 'users', currentUser.uid)
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(ref, payload, { merge: true })

      // Update local store so the rest of the app reflects changes
      useAuthStore.setState((state) => ({
        user: {
          ...state.user,
          name: payload.name,
          phone: payload.phone,
        },
      }))

      Alert.alert('Success', 'Profile updated')
    } catch (error) {
      console.error('Edit profile error:', error)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="person" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Full Name</Text>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="call" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Phone</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Ionicons name="hourglass" size={20} color={colors.white} />
            ) : (
              <Ionicons name="save" size={20} color={colors.white} />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
    color: colors.neutral[900],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  input: {
    backgroundColor: '#F4F4F5',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: colors.neutral[900],
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})

export default PatientEditProfile

