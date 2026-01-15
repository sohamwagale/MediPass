import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const PatientHelpCenter = () => {
  const handleContactEmail = () => {
    Linking.openURL('mailto:support@medipass.app')
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Help Center</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>Getting Started</Text>
          <Text style={styles.text}>
            MediPass helps you manage your medical records, share them securely
            with doctors, and keep critical emergency information up to date.
          </Text>

          <Text style={styles.heading}>Common questions</Text>
          <Text style={styles.bullet}>
            • How do I update my emergency profile?
          </Text>
          <Text style={styles.answer}>
            Go to the Emergency tab and tap &quot;Edit Emergency Profile&quot; to update blood group,
            conditions and contacts.
          </Text>
          <Text style={styles.bullet}>
            • Who can see my medical data?
          </Text>
          <Text style={styles.answer}>
            Only you and doctors you explicitly share access with can view your
            detailed medical records.
          </Text>

          <Text style={styles.heading}>Need more help?</Text>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContactEmail}>
            <Ionicons name="mail" size={20} color={colors.white} />
            <Text style={styles.contactText}>Contact Support</Text>
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
    color: colors.neutral[900],
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 8,
  },
  text: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  bullet: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  answer: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  contactBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    borderRadius: 14,
  },
  contactText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
})

export default PatientHelpCenter

