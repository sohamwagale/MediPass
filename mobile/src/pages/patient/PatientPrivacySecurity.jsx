import React from 'react'
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

const PatientPrivacySecurity = () => {
  const [shareData, setShareData] = React.useState(true)
  const [twoFactor, setTwoFactor] = React.useState(false)

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy & Security</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="shield-checkmark"
                size={22}
                color={colors.success[600]}
              />
              <View>
                <Text style={styles.rowTitle}>Share health data</Text>
                <Text style={styles.rowSubtitle}>
                  Allow doctors to access your medical history with your consent.
                </Text>
              </View>
            </View>
            <Switch
              value={shareData}
              onValueChange={setShareData}
              thumbColor={shareData ? colors.primary[600] : '#f4f3f4'}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="key" size={22} color={colors.primary[600]} />
              <View>
                <Text style={styles.rowTitle}>Two-factor authentication</Text>
                <Text style={styles.rowSubtitle}>
                  Add an extra layer of security to your account.
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              thumbColor={twoFactor ? colors.primary[600] : '#f4f3f4'}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.neutral[600]}
            />
            <Text style={styles.infoText}>
              These settings are stored locally for now. In a production setup,
              they should be synced with your account on the server.
            </Text>
          </View>
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.neutral[600],
  },
})

export default PatientPrivacySecurity

