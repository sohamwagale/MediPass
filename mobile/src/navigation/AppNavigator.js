import React, { useEffect, /*useRef*/ } from 'react'
import { NavigationContainer, CommonActions } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/authStore'
import { colors } from '../constants/colors'
import { initializeNotifications, setupPatientNotificationListener } from '../services/notificationService'

// Navigation ref for global navigation access
export const navigationRef = React.createRef()

// Helper function to navigate from anywhere
export const navigate = (name, params) => {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params)
  }
}

// Public Screens
import LandingPage from '../pages/public/LandingPage'
import LoginPage from '../pages/public/LoginPage'
import SignupPage from '../pages/public/SignupPage'
import RoleSelection from '../pages/public/RoleSelection'

// Patient Screens
import PatientDashboard from '../pages/patient/PatientDashboard'
import PatientQRCode from '../pages/patient/PatientQRCode'
import PatientMedicalTimeline from '../pages/patient/PatientMedicalTimeline'
import PatientPrescriptions from '../pages/patient/PatientPrescriptions'
// import PatientEmergencyProfile from '../pages/patient/PatientEmergencyProfile'
import EditEmergencyProfile from '../pages/patient/EditEmergencyProfile'

import PatientChatbot from '../pages/patient/PatientChatbot'
import PatientProfile from '../pages/patient/PatientProfile'
import PatientEditProfile from '../pages/patient/PatientEditProfile'
import PatientPrivacySecurity from '../pages/patient/PatientPrivacySecurity'
import PatientNotifications from '../pages/patient/PatientNotifications'
import PatientHelpCenter from '../pages/patient/PatientHelpCenter'
import PatientTermsConditions from '../pages/patient/PatientTermsConditions'
import PatientDoctorsList from '../pages/patient/PatientDoctorsList'
import PatientDoctorProfile from '../pages/patient/PatientDoctorProfile'
import DiagnosisDetail from '../pages/common/DiagnosisDetail'

// Doctor Screens
import DoctorDashboard from '../pages/doctor/DoctorDashboard'
import DoctorQRScanner from '../pages/doctor/DoctorQRScanner'
import DoctorPatientsList from '../pages/doctor/DoctorPatientsList'
import DoctorPatientProfile from '../pages/doctor/DoctorPatientProfile'
import DoctorAddDiagnosis from '../pages/doctor/DoctorAddDiagnosis'
import DoctorProfile from '../pages/doctor/DoctorProfile'
import DoctorEditProfile from '../pages/doctor/DoctorEditProfile'
import DoctorPrivacySecurity from '../pages/doctor/DoctorPrivacySecurity'
import DoctorNotifications from '../pages/doctor/DoctorNotifications'
import DoctorHelpCenter from '../pages/doctor/DoctorHelpCenter'
import DoctorTermsConditions from '../pages/doctor/DoctorTermsConditions'
import DoctorPrescribeMedication from '../pages/doctor/DoctorPrescribeMedication'
import PatientEmergencyProfile from '../pages/patient/PatientEmergencyProfile'



const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// -------------------------
// Patient Bottom Tab Navigator
// -------------------------
const PatientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.neutral[200],
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'home'

          if (route.name === 'PatientDashboard') iconName = focused ? 'home' : 'home-outline'
          else if (route.name === 'PatientQRCode') iconName = focused ? 'qr-code' : 'qr-code-outline'
          else if (route.name === 'PatientMedicalTimeline') iconName = focused ? 'pulse' : 'pulse-outline'
          else if (route.name === 'PatientPrescriptions') iconName = focused ? 'medkit' : 'medkit-outline'
          else if (route.name === 'PatientEmergencyProfile') iconName = focused ? 'warning' : 'warning-outline'
          else if (route.name === 'PatientChatbot') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'
          else if (route.name === 'PatientProfile') iconName = focused ? 'person' : 'person-outline'

          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen
        name="PatientDashboard"
        component={PatientDashboard}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="PatientQRCode"
        component={PatientQRCode}
        options={{ title: 'My QR' }}
      />
      <Tab.Screen
        name="PatientMedicalTimeline"
        component={PatientMedicalTimeline}
        options={{ title: 'Timeline' }}
      />
      <Tab.Screen
        name="PatientPrescriptions"
        component={PatientPrescriptions}
        options={{ title: 'Meds' }}
      />
      <Tab.Screen
        name="PatientEmergencyProfile"
        component={PatientEmergencyProfile}
        options={{ title: 'Emergency' }}
      />
      <Tab.Screen
        name="PatientChatbot"
        component={PatientChatbot}
        options={{ title: 'Chatbot' }}
      />
      <Tab.Screen
        name="PatientProfile"
        component={PatientProfile}
        options={{ title: 'Profile' }}
      />

    </Tab.Navigator>
  )
}

// -------------------------
// Doctor Bottom Tab Navigator
// -------------------------
const DoctorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.neutral[200],
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'home'

          if (route.name === 'DoctorDashboard') iconName = focused ? 'home' : 'home-outline'
          else if (route.name === 'DoctorQRScanner') iconName = focused ? 'scan' : 'scan-outline'
          else if (route.name === 'DoctorPatientsList') iconName = focused ? 'people' : 'people-outline'
          else if (route.name === 'DoctorProfile') iconName = focused ? 'person' : 'person-outline'

          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen
        name="DoctorDashboard"
        component={DoctorDashboard}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="DoctorQRScanner"
        component={DoctorQRScanner}
        options={{ title: 'Scan' }}
      />
      <Tab.Screen
        name="DoctorPatientsList"
        component={DoctorPatientsList}
        options={{ title: 'Patients' }}
      />
      <Tab.Screen
        name="DoctorProfile"
        component={DoctorProfile}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  )
}

const AppNavigator = () => {
  const { user, token, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
    // Initialize notifications on app start
    initializeNotifications()
  }, [initializeAuth])

  // Setup patient notification listener
  useEffect(() => {
    if (user?.role === 'patient' && token) {
      const unsubscribe = setupPatientNotificationListener(user.uid || user.id)
      return () => {
        if (unsubscribe) unsubscribe()
      }
    }
  }, [user, token])

  useEffect(() => {
    // Navigate to appropriate screen when auth state changes
    // Use a small delay to ensure navigation is ready
    const timeoutId = setTimeout(() => {
      if (navigationRef.current?.isReady()) {
      const isAuthenticated = !!token
      const isPatient = user?.role === 'patient'
      const isDoctor = user?.role === 'doctor'

        try {
      if (isAuthenticated) {
        if (isPatient) {
              navigationRef.current.dispatch(
                CommonActions.reset({
            index: 0,
            routes: [{ name: 'PatientRoot' }],
          })
              )
        } else if (isDoctor) {
              navigationRef.current.dispatch(
                CommonActions.reset({
            index: 0,
            routes: [{ name: 'DoctorRoot' }],
          })
              )
        }
      } else {
            // When logged out, navigate to Landing
            const currentRoute = navigationRef.current.getCurrentRoute()
            if (currentRoute?.name !== 'Landing') {
              // Use navigate instead of reset for logout to avoid navigation state issues
              navigationRef.current.navigate('Landing')
            }
          }
        } catch (error) {
          console.error('Navigation reset error:', error)
          // Fallback: try simple navigate
          if (!isAuthenticated) {
            try {
              navigationRef.current.navigate('Landing')
            } catch (navError) {
              console.error('Fallback navigation error:', navError)
            }
      }
    }
      }
    }, 100) // Small delay to ensure state is updated

    return () => clearTimeout(timeoutId)
  }, [user, token])

  const isAuthenticated = !!token
  const isPatient = user?.role === 'patient'
  const isDoctor = user?.role === 'doctor'

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Landing" component={LandingPage} />
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Signup" component={SignupPage} />
            <Stack.Screen name="RoleSelection" component={RoleSelection} />
          </>
        ) : isPatient ? (
          <>
            <Stack.Screen name="PatientRoot" component={PatientTabNavigator} />
            {/* Emergency edit form (stack screen on top of tabs) */}
            <Stack.Screen
              name="EditEmergencyProfile"
              component={EditEmergencyProfile}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PatientEditProfile"
              component={PatientEditProfile}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PatientPrivacySecurity"
              component={PatientPrivacySecurity}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PatientNotifications"
              component={PatientNotifications}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PatientHelpCenter"
              component={PatientHelpCenter}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PatientTermsConditions"
              component={PatientTermsConditions}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PatientDoctorsList"
              component={PatientDoctorsList}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PatientDoctorProfile"
              component={PatientDoctorProfile}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DiagnosisDetail"
              component={DiagnosisDetail}
              options={{ headerShown: false }}
            />
          </>
        ) : isDoctor ? (
          <>
            <Stack.Screen name="DoctorRoot" component={DoctorTabNavigator} />
            <Stack.Screen
              name="DoctorPatientProfile"
              component={DoctorPatientProfile}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorAddDiagnosis"
              component={DoctorAddDiagnosis}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorPrescribeMedication"
              component={DoctorPrescribeMedication}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorEditProfile"
              component={DoctorEditProfile}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorPrivacySecurity"
              component={DoctorPrivacySecurity}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorNotifications"
              component={DoctorNotifications}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorHelpCenter"
              component={DoctorHelpCenter}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DoctorTermsConditions"
              component={DoctorTermsConditions}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DiagnosisDetail"
              component={DiagnosisDetail}
              options={{ headerShown: false }}
            />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator

