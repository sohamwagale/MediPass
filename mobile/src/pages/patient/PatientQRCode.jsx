import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PatientQR from '../../components/patient/PatientQR'
import Navbar from '../../components/common/Navbar'
import FloatingChatbotButton from '../../components/patient/FloatingChatbotButton'
import { colors } from '../../constants/colors'

const PatientQRCode = () => {
  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <PatientQR />
        
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
  },
  contentContainer: {
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  securityInfo: {
    marginTop: 32,
    padding: 24,
    backgroundColor: colors.primary[50],
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success[700],
  },
  securityList: {
    alignItems: 'center',
    gap: 8,
  },
  securityItem: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success[600],
  },
})

export default PatientQRCode

