// services/notificationService.js
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted')
      return false
    }

    // For Android, set notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })

      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      })

      await Notifications.setNotificationChannelAsync('diagnosis-updates', {
        name: 'Diagnosis Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      })
    }

    return true
  } catch (error) {
    console.error('Error requesting notification permissions:', error)
    return false
  }
}

/**
 * Send an immediate notification
 */
export const sendNotification = async (title, body, data = {}) => {
  try {
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      console.warn('Cannot send notification: permissions not granted')
      return false
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    })

    return true
  } catch (error) {
    console.error('Error sending notification:', error)
    return false
  }
}

/**
 * Schedule a daily medication reminder notification
 * @param {string} medicationId - Unique ID for the medication
 * @param {string} medicationName - Name of the medication
 * @param {string} dosage - Dosage information
 * @param {string} frequency - Frequency (e.g., "Daily", "Twice daily", "8:00 AM, 8:00 PM")
 * @param {Date} startDate - When to start reminders
 * @param {Date} endDate - When to stop reminders
 * @param {object} data - Additional data to pass with notification
 */
export const scheduleMedicationReminder = async (
  medicationId,
  medicationName,
  dosage,
  frequency,
  startDate,
  endDate,
  data = {}
) => {
  try {
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      console.warn('Cannot schedule medication reminder: permissions not granted')
      return null
    }

    // Parse frequency to determine notification times
    const reminderTimes = parseFrequencyToTimes(frequency)
    
    if (reminderTimes.length === 0) {
      console.warn('No valid reminder times found for frequency:', frequency)
      return null
    }

    const endTimestamp = endDate.getTime()
    const now = Date.now()

    if (endTimestamp <= now) {
      console.warn('End date is in the past, skipping reminder')
      return null
    }

    const notificationIds = []

    // Schedule notifications for each day until endDate
    // We'll schedule individual notifications for each day to respect the end date
    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0)
    const endDateOnly = new Date(endDate)
    endDateOnly.setHours(23, 59, 59, 999)

    // Limit to 100 days to avoid too many notifications
    let daysScheduled = 0
    const maxDays = 100

    // Schedule notifications for each day
    while (currentDate <= endDateOnly && daysScheduled < maxDays) {
      for (const time of reminderTimes) {
        const [hours, minutes] = time.split(':').map(Number)
        
        // Create notification date/time
        const notificationDate = new Date(currentDate)
        notificationDate.setHours(hours, minutes, 0, 0)

        // Only schedule if the notification time hasn't passed
        if (notificationDate > new Date()) {
          const identifier = `medication-${medicationId}-${currentDate.getTime()}-${time}`
          
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '💊 Medication Reminder',
              body: `Time to take ${medicationName}${dosage ? ` (${dosage})` : ''}`,
              data: {
                type: 'medication-reminder',
                medicationId,
                medicationName,
                dosage,
                endDate: endDate.toISOString(),
                ...data,
              },
              sound: true,
            },
            trigger: notificationDate,
            identifier,
          })

          notificationIds.push(notificationId)
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
      daysScheduled++
    }

    console.log(`✅ Scheduled ${notificationIds.length} medication reminders for ${medicationName}`)
    return notificationIds
  } catch (error) {
    console.error('Error scheduling medication reminder:', error)
    return null
  }
}

/**
 * Parse frequency string to extract times
 * Examples:
 * - "Daily" -> ["09:00"]
 * - "Twice daily" -> ["09:00", "21:00"]
 * - "8:00 AM, 8:00 PM" -> ["08:00", "20:00"]
 * - "Morning, Evening" -> ["09:00", "20:00"]
 */
const parseFrequencyToTimes = (frequency) => {
  if (!frequency) return ['09:00'] // Default to 9 AM

  const lowerFreq = frequency.toLowerCase().trim()

  // Handle common patterns
  if (lowerFreq.includes('once') || lowerFreq === 'daily') {
    return ['09:00'] // Default morning time
  }

  if (lowerFreq.includes('twice') || lowerFreq.includes('2x')) {
    return ['09:00', '21:00'] // Morning and evening
  }

  if (lowerFreq.includes('three') || lowerFreq.includes('3x')) {
    return ['09:00', '14:00', '21:00'] // Morning, afternoon, evening
  }

  // Try to extract times from string (e.g., "8:00 AM, 8:00 PM")
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/gi
  const matches = [...frequency.matchAll(timePattern)]
  
  if (matches.length > 0) {
    return matches.map((match) => {
      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const period = match[3].toUpperCase()

      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    })
  }

  // Default fallback
  return ['09:00']
}

/**
 * Cancel all medication reminders for a specific medication
 */
export const cancelMedicationReminders = async (medicationId) => {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync()
    
    const medicationNotifications = allNotifications.filter((notification) => {
      const identifier = notification.identifier || ''
      return identifier.startsWith(`medication-${medicationId}-`)
    })

    for (const notification of medicationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier)
    }

    console.log(`✅ Cancelled ${medicationNotifications.length} reminders for medication ${medicationId}`)
    return true
  } catch (error) {
    console.error('Error canceling medication reminders:', error)
    return false
  }
}

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    console.log('✅ Cancelled all scheduled notifications')
    return true
  } catch (error) {
    console.error('Error canceling all notifications:', error)
    return false
  }
}

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync()
  } catch (error) {
    console.error('Error getting scheduled notifications:', error)
    return []
  }
}

/**
 * Send diagnosis notification to patient
 * Stores notification in Firestore, patient's app will listen and show local notification
 */
export const sendDiagnosisNotification = async (patientId, doctorName, diagnosis) => {
  try {
    const { db } = require('./firebase')
    const { collection, addDoc, serverTimestamp } = require('firebase/firestore')
    
    if (!db || !patientId) {
      console.warn('Cannot send diagnosis notification: missing db or patientId')
      return false
    }

    // Store notification in Firestore for the patient
    const notificationsRef = collection(db, 'users', patientId, 'notifications')
    await addDoc(notificationsRef, {
      type: 'diagnosis-update',
      title: '📋 New Diagnosis Added',
      body: `${doctorName} has added a new diagnosis to your medical timeline`,
      doctorName,
      diagnosis,
      read: false,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString(),
    })

    console.log('✅ Diagnosis notification stored in Firestore for patient:', patientId)
    return true
  } catch (error) {
    console.error('Error sending diagnosis notification:', error)
    return false
  }
}

/**
 * Setup real-time listener for patient notifications
 * Shows local notifications when new notifications arrive in Firestore
 */
export const setupPatientNotificationListener = (patientId) => {
  try {
    const { db } = require('./firebase')
    const { collection, query, onSnapshot, orderBy, limit } = require('firebase/firestore')
    
    if (!db || !patientId) {
      console.warn('Cannot setup notification listener: missing db or patientId')
      return null
    }

    // Listen for all notifications, then filter unread ones in memory
    // This avoids needing a composite index while it's building
    const notificationsRef = collection(db, 'users', patientId, 'notifications')
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(10) // Get last 10 notifications to find unread ones
    )

    let lastNotificationTime = null
    let processedNotificationIds = new Set()

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (!snapshot.empty) {
          // Filter for unread notifications
          const unreadNotifications = snapshot.docs.filter(
            (doc) => {
              const data = doc.data()
              return data.read === false || data.read === undefined
            }
          )

          if (unreadNotifications.length > 0) {
            // Get the most recent unread notification
            const latestNotification = unreadNotifications[0]
            const notificationId = latestNotification.id
            
            // Skip if we've already processed this notification
            if (processedNotificationIds.has(notificationId)) {
              return
            }

            const notificationData = latestNotification.data()
            
            // Get timestamp to avoid duplicate notifications
            const notificationTime = notificationData.timestamp || notificationId
            
            // Only show notification if it's new (different from last one)
            if (notificationTime !== lastNotificationTime) {
              lastNotificationTime = notificationTime
              processedNotificationIds.add(notificationId)
              
              // Show local notification
              const hasPermission = await requestNotificationPermissions()
              if (hasPermission) {
                await sendNotification(
                  notificationData.title || '📋 New Update',
                  notificationData.body || 'You have a new update',
                  {
                    type: notificationData.type || 'general',
                    notificationId: notificationId,
                    ...notificationData,
                  }
                )
              }

              // Mark as read after showing notification
              try {
                const { doc, updateDoc } = require('firebase/firestore')
                const notificationRef = doc(db, 'users', patientId, 'notifications', notificationId)
                await updateDoc(notificationRef, { read: true })
              } catch (error) {
                console.error('Error marking notification as read:', error)
              }
            }
          }
        }
      },
      (error) => {
        console.error('Error in notification listener:', error)
        // If index error, log it but don't crash - the index will be ready soon
        if (error.code === 'failed-precondition') {
          console.warn('⚠️ Firestore index is still building. Notifications will work once the index is ready.')
        }
      }
    )

    console.log('✅ Patient notification listener setup for:', patientId)
    return unsubscribe
  } catch (error) {
    console.error('Error setting up notification listener:', error)
    return null
  }
}

/**
 * Initialize notifications on app start
 */
export const initializeNotifications = async () => {
  try {
    await requestNotificationPermissions()
    console.log('✅ Notifications initialized')
  } catch (error) {
    console.error('Error initializing notifications:', error)
  }
}
