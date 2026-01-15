import React from 'react'
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const PatientNotifications = () => {
  const [appointment, setAppointment] = React.useState(true)
  const [medication, setMedication] = React.useState(true)
  const [system, setSystem] = React.useState(true)

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notifications</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="calendar"
                size={22}
                color={colors.primary[600]}
              />
              <View>
                <Text style={styles.rowTitle}>Appointment reminders</Text>
                <Text style={styles.rowSubtitle}>
                  Get notified before upcoming appointments.
                </Text>
              </View>
            </View>
            <Switch
              value={appointment}
              onValueChange={setAppointment}
              thumbColor={appointment ? colors.primary[600] : '#f4f3f4'}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="medkit" size={22} color={colors.success[600]} />
              <View>
                <Text style={styles.rowTitle}>Medication alerts</Text>
                <Text style={styles.rowSubtitle}>
                  Daily reminders for your prescriptions.
                </Text>
              </View>
            </View>
            <Switch
              value={medication}
              onValueChange={setMedication}
              thumbColor={medication ? colors.primary[600] : '#f4f3f4'}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="notifications"
                size={22}
                color={colors.neutral[700]}
              />
              <View>
                <Text style={styles.rowTitle}>System updates</Text>
                <Text style={styles.rowSubtitle}>
                  Announcements about new features and security updates.
                </Text>
              </View>
            </View>
            <Switch
              value={system}
              onValueChange={setSystem}
              thumbColor={system ? colors.primary[600] : '#f4f3f4'}
            />
          </View>

          <Text style={styles.footerText}>
            Notification preferences are stored locally for now. In production,
            sync these with your account backend.
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
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.neutral[600],
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 8,
  },
})

export default PatientNotifications

