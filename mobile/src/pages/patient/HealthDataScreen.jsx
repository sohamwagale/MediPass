import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { auth, db } from '../../services/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import {
  authorizeFitbit,
  isFitbitConnected,
  syncTodayHealthData,
  disconnectFitbit,
} from '../../services/fitbit'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'

const HealthDataScreen = () => {
  const { user } = useAuthStore()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [steps, setSteps] = useState(0)
  const [calories, setCalories] = useState(0)
  const [lastSynced, setLastSynced] = useState(null)

  useEffect(() => {
    checkConnection()
    loadHealthData()
  }, [])

  const checkConnection = async () => {
    try {
      const isConnected = await isFitbitConnected()
      setConnected(isConnected)
    } catch (error) {
      console.error('Error checking Fitbit connection:', error)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const loadHealthData = async () => {
    const patientUid = auth?.currentUser?.uid || user?.uid || user?.id
    if (!patientUid || !db) {
      return
    }

    try {
      const patientDocRef = doc(db, 'users', patientUid)
      const patientDoc = await getDoc(patientDocRef)

      if (patientDoc.exists()) {
        const data = patientDoc.data()
        const healthData = data.healthData || {}
        const today = new Date().toISOString().split('T')[0]

        if (healthData.date === today) {
          setSteps(healthData.steps || 0)
          setCalories(healthData.calories || 0)
          setLastSynced(healthData.lastSynced || null)
        }
      }
    } catch (error) {
      console.error('Error loading health data:', error)
    }
  }

  const handleConnectFitbit = async () => {
    try {
      setLoading(true)
      const result = await authorizeFitbit()

      if (result.success) {
        setConnected(true)
        Alert.alert('Success', 'Fitbit connected successfully!')
      } else {
        // Show detailed error message
        const errorMessage = result.error || 'Failed to connect Fitbit'
        
        // Check if it's a configuration error
        if (errorMessage.includes('not configured')) {
          Alert.alert(
            'Configuration Required',
            errorMessage + '\n\nSee FITBIT_SETUP.md for setup instructions.',
            [
              { text: 'OK', style: 'default' },
            ]
          )
        } else {
          Alert.alert('Error', errorMessage)
        }
      }
    } catch (error) {
      console.error('Fitbit connection error:', error)
      Alert.alert(
        'Error',
        'Failed to connect Fitbit. Please check:\n\n1. Client ID is set in src/services/fitbit.js\n2. Client Secret is set in src/services/fitbit.js\n3. Redirect URI is configured in Fitbit app settings\n\nSee FITBIT_SETUP.md for details.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSyncHealthData = async () => {
    const patientUid = auth?.currentUser?.uid || user?.uid || user?.id
    if (!patientUid || !db) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    try {
      setSyncing(true)
      const result = await syncTodayHealthData()

      if (result.success) {
        // Save to Firebase
        const patientDocRef = doc(db, 'users', patientUid)
        await setDoc(
          patientDocRef,
          {
            healthData: {
              steps: result.steps,
              calories: result.calories,
              date: result.date,
              lastSynced: serverTimestamp(),
            },
          },
          { merge: true }
        )

        setSteps(result.steps)
        setCalories(result.calories)
        setLastSynced(new Date().toISOString())

        Alert.alert('Success', `Synced ${result.steps} steps and ${result.calories} calories!`)
      } else {
        Alert.alert('Error', result.error || 'Failed to sync health data')
      }
    } catch (error) {
      console.error('Sync error:', error)
      Alert.alert('Error', 'Failed to sync health data. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Fitbit',
      'Are you sure you want to disconnect your Fitbit account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectFitbit()
              setConnected(false)
              setSteps(0)
              setCalories(0)
              setLastSynced(null)
              Alert.alert('Success', 'Fitbit disconnected successfully')
            } catch (error) {
              console.error('Disconnect error:', error)
              Alert.alert('Error', 'Failed to disconnect Fitbit')
            }
          },
        },
      ]
    )
  }

  if (loading && !connected) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="fitness" size={32} color={colors.primary[600]} />
          </View>
          <Text style={styles.title}>Health Data</Text>
          <Text style={styles.subtitle}>Sync your Fitbit data</Text>
        </View>

        {!connected ? (
          <View style={styles.card}>
            <View style={styles.connectSection}>
              <Ionicons name="pulse" size={64} color={colors.neutral[400]} />
              <Text style={styles.connectTitle}>Connect Your Fitbit</Text>
              <Text style={styles.connectText}>
                Connect your Fitbit account to automatically sync your daily steps and calories burned.
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnectFitbit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="link" size={20} color={colors.white} />
                    <Text style={styles.connectButtonText}>Connect Fitbit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Connection Status */}
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <View style={styles.statusLeft}>
                  <View style={styles.statusIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success[600]} />
                  </View>
                  <View>
                    <Text style={styles.statusTitle}>Fitbit Connected</Text>
                    <Text style={styles.statusSubtitle}>Ready to sync</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnect}
                >
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sync Button */}
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSyncHealthData}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="sync" size={20} color={colors.white} />
                  <Text style={styles.syncButtonText}>Sync Health Data</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Health Data Display */}
            {(steps > 0 || calories > 0) && (
              <View style={styles.dataSection}>
                <View style={styles.dataCard}>
                  <View style={styles.dataIconContainer}>
                    <Ionicons name="walk" size={32} color={colors.primary[600]} />
                  </View>
                  <Text style={styles.dataLabel}>Steps</Text>
                  <Text style={styles.dataValue}>{steps.toLocaleString()}</Text>
                </View>

                <View style={styles.dataCard}>
                  <View style={[styles.dataIconContainer, { backgroundColor: colors.success[100] }]}>
                    <Ionicons name="flame" size={32} color={colors.success[600]} />
                  </View>
                  <Text style={styles.dataLabel}>Calories</Text>
                  <Text style={styles.dataValue}>{calories.toLocaleString()}</Text>
                </View>
              </View>
            )}

            {lastSynced && (
              <Text style={styles.lastSyncedText}>
                Last synced: {new Date(lastSynced).toLocaleString()}
              </Text>
            )}

            {steps === 0 && calories === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle" size={48} color={colors.neutral[400]} />
                <Text style={styles.emptyText}>
                  No health data synced today. Tap "Sync Health Data" to get started.
                </Text>
              </View>
            )}
          </>
        )}
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
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  connectSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 16,
    marginBottom: 8,
  },
  connectText: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  connectButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  disconnectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error[300],
  },
  disconnectButtonText: {
    color: colors.error[600],
    fontSize: 14,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  dataSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dataCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dataIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dataLabel: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 8,
  },
  dataValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  lastSyncedText: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
  },
})

export default HealthDataScreen
