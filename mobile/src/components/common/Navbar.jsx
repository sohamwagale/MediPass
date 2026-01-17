import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'

const Navbar = () => {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const isPatient = user?.role === 'patient'

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => {
            // Navigate to dashboard based on current route
            const state = navigation.getState()
            const currentRoute = state?.routes[state?.index]?.name
            if (currentRoute?.includes('Patient')) {
              navigation.navigate('PatientDashboard')
            } else if (currentRoute?.includes('Doctor')) {
              navigation.navigate('DoctorDashboard')
            }
          }}
        >
          <View style={styles.logo}>
            <Ionicons name="qr-code" size={24} color={colors.white} />
          </View>
          <Text style={styles.logoText}>MediPass</Text>
        </TouchableOpacity>
        
        {isPatient && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('PatientProfile')}
          >
            <Ionicons name="person" size={24} color={colors.neutral[900]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.grey,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingTop: 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
})

export default Navbar

