import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MedicalTimeline from '../../components/common/MedicalTimeline'
import Navbar from '../../components/common/Navbar'
import FloatingChatbotButton from '../../components/patient/FloatingChatbotButton'
import { colors } from '../../constants/colors'

const PatientMedicalTimeline = () => {
  const navigation = useNavigation()

  const handleShowQR = () => {
    // Navigate to the PatientQRCode tab
    navigation.navigate('PatientQRCode')
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="pulse" size={28} color={colors.primary[600]} />
          </View>
          <View>
            <Text style={styles.title}>Medical History</Text>
            <Text style={styles.subtitle}>Complete timeline of your healthcare journey</Text>
          </View>
        </View>

        <MedicalTimeline />
        
        <View style={styles.emptyCard}>
          <Ionicons name="document-text" size={64} color={colors.neutral[400]} />
          <Text style={styles.emptyTitle}>No more records?</Text>
          <Text style={styles.emptyText}>
            Your medical timeline will automatically update as healthcare providers add new records.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleShowQR}>
            <Ionicons name="qr-code" size={20} color={colors.white} />
            <Text style={styles.emptyButtonText}>Show QR to Doctor</Text>
          </TouchableOpacity>
        </View>
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
    gap: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
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
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
})

export default PatientMedicalTimeline

