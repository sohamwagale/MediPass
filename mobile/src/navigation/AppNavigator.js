import React, { useEffect, /*useRef*/ } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/authStore'
import { colors } from '../constants/colors'

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

// Doctor Screens
import DoctorDashboard from '../pages/doctor/DoctorDashboard'
import DoctorQRScanner from '../pages/doctor/DoctorQRScanner'
import DoctorPatientProfile from '../pages/doctor/DoctorPatientProfile'
import DoctorAddDiagnosis from '../pages/doctor/DoctorAddDiagnosis'
import DoctorProfile from '../pages/doctor/DoctorProfile'
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
  }, [])

  useEffect(() => {
    // Navigate to appropriate screen when auth state changes
    if (navigationRef.current) {
      const isAuthenticated = !!token
      const isPatient = user?.role === 'patient'
      const isDoctor = user?.role === 'doctor'

      if (isAuthenticated) {
        if (isPatient) {
          navigationRef.current.resetRoot({
            index: 0,
            routes: [{ name: 'PatientRoot' }],
          })
        } else if (isDoctor) {
          navigationRef.current.resetRoot({
            index: 0,
            routes: [{ name: 'DoctorRoot' }],
          })
        }
      } else {
        navigationRef.current.resetRoot({
          index: 0,
          routes: [{ name: 'Landing' }],
        })
      }
    }
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
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator

