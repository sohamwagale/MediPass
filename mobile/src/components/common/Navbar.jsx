import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { getColors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'

const Navbar = () => {
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const isPatient = user?.role === 'patient'
  const colors = getColors(isDarkMode)

  return (
    <View style={[styles.container, { backgroundColor: colors.grey, borderBottomColor: colors.neutral[200] }]}>
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
          <View style={[styles.logo, { backgroundColor: colors.primary[600] }]}>
            <Ionicons name="qr-code" size={24} color={colors.white} />
          </View>
          <Text style={[styles.logoText, { color: colors.neutral[900] }]}>MediPass</Text>
        </TouchableOpacity>
        
        {isPatient && (
          <View style={styles.rightButtons}>
            <View style={styles.darkModeContainer}>
              <Ionicons 
                name={isDarkMode ? 'moon' : 'sunny'} 
                size={20} 
                color={colors.neutral[700]} 
              />
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                thumbColor={colors.white}
                style={styles.switch}
              />
            </View>
            <TouchableOpacity
              style={[styles.profileButton, { 
                backgroundColor: colors.neutral[100], 
                borderColor: colors.neutral[200] 
              }]}
              onPress={() => navigation.navigate('PatientProfile')}
            >
              <Ionicons name="person" size={24} color={colors.neutral[900]} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  darkModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
})

export default Navbar

