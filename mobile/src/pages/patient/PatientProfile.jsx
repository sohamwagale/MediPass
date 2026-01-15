import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/authStore'
import { navigationRef } from '../../navigation/AppNavigator'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const PatientProfile = () => {
  const { user, logout } = useAuthStore()
  const navigation = useNavigation()

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout()
            // Reset navigation to Landing page
            if (navigationRef.current) {
              navigationRef.current.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Landing' }],
                })
              )
            }
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@email.com'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="person" size={16} color={colors.primary[600]} />
            <Text style={styles.roleText}>Patient</Text>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => navigation.navigate('PatientEditProfile')}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="person-circle" size={24} color={colors.primary[600]} />
              </View>
              <Text style={styles.optionText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => navigation.navigate('PatientPrivacySecurity')}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: colors.success[100] }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.success[600]} />
              </View>
              <Text style={styles.optionText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => navigation.navigate('PatientNotifications')}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: colors.neutral[200] }]}>
                <Ionicons name="notifications" size={24} color={colors.neutral[700]} />
              </View>
              <Text style={styles.optionText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => navigation.navigate('PatientHelpCenter')}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="help-circle" size={24} color={colors.primary[600]} />
              </View>
              <Text style={styles.optionText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => navigation.navigate('PatientTermsConditions')}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: colors.neutral[200] }]}>
                <Ionicons name="document-text" size={24} color={colors.neutral[700]} />
              </View>
              <Text style={styles.optionText}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={colors.white} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>MediPass v1.0.0</Text>
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
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: colors.white,
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: colors.neutral[600],
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral[900],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[700],
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.neutral[500],
  },
})

export default PatientProfile

