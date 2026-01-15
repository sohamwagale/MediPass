import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'

import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const PatientTermsConditions = () => {
  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms & Conditions</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>1. Service</Text>
          <Text style={styles.text}>
            MediPass is a digital health record assistant designed to help you
            store and share your medical information securely.
          </Text>

          <Text style={styles.heading}>2. Data responsibility</Text>
          <Text style={styles.text}>
            You are responsible for verifying that your medical data is correct
            and up to date. Always consult a licensed medical professional for
            diagnosis and treatment.
          </Text>

          <Text style={styles.heading}>3. Privacy</Text>
          <Text style={styles.text}>
            We take privacy seriously. Your data is only shared with doctors or
            caregivers when you explicitly grant access.
          </Text>

          <Text style={styles.heading}>4. Use of the app</Text>
          <Text style={styles.text}>
            Do not misuse the app, attempt to break security, or access other
            users&apos; data. Violations may result in account suspension.
          </Text>
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
})

export default PatientTermsConditions

