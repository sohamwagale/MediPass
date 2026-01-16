import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import ViewShot from 'react-native-view-shot'
import { useAuthStore } from '../../stores/authStore'
import { mockPatients } from '../../data/mockData'
import { colors } from '../../constants/colors'
import QRCode from "react-native-qrcode-svg"
import * as MediaLibrary from 'expo-media-library'
// import { Alert, Platform } from 'react-native';

// Safe import with fallback for QRCode
// let QRCode = null

// try {
// } catch (error) {
//   console.warn('react-native-qrcode-svg not available, using fallback')
//   qrCodeAvailable = false
// }

const PatientQR = ({ patientId }) => {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const viewShotRef = useRef(null)

  // Use logged-in user's email as QR code value, or fallback to mock patient
  const patient = mockPatients.find(p => p.id === patientId)
  const qrValue = user?.email || patient?.email || 'patient@email.com'

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(qrValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      Alert.alert('Copied!', 'Email address copied to clipboard')
    } catch (error) {
      Alert.alert('Error', 'Failed to copy email address')
      console.log(error)
    }
  }

  const captureQRCode = async () => {
    if (!viewShotRef.current) {
      Alert.alert('Error', 'Unable to capture QR code')
      return null
    }

    try {
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      })
      return uri
    } catch (error) {
      console.error('Error capturing QR code:', error)
      Alert.alert('Error', 'Failed to capture QR code image')
      return null
    }
  }

  // const handleDownload = async () => {
  //   setSaving(true)
  //   try {
  //     const uri = await captureQRCode()
  //     if (!uri) {
  //       setSaving(false)
  //       return
  //     }

  //     // Ensure documentDirectory is available
  //     if (!FileSystem.documentDirectory) {
  //       throw new Error('Document directory is not available')
  //     }

  //     const filename = `MediPass_QR_${Date.now()}.png`
  //     const fileUri = `${FileSystem.documentDirectory}${filename}`

  //     // Copy the captured image to a permanent location using legacy API
  //     await FileSystem.copyAsync({
  //       from: uri,
  //       to: fileUri,
  //     })

  //     // Check if sharing is available
  //     const isAvailable = await Sharing.isAvailableAsync()
  //     if (isAvailable) {
  //       await Sharing.shareAsync(fileUri, {
  //         mimeType: 'image/png',
  //         dialogTitle: 'Save QR Code',
  //       })
  //       Alert.alert('Success', 'QR code saved successfully!')
  //     } else {
  //       Alert.alert('Success', `QR code saved to: ${fileUri}`)
  //     }
  //   } catch (error) {
  //     console.error('Error downloading QR code:', error)
  //     Alert.alert('Error', 'Failed to download QR code')
  //   } finally {
  //     setSaving(false)
  //   }
  // }

  const handleDownload = async () => {
    setSaving(true)

    try {
      // Ask permission to save to gallery
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Storage permission is needed to save the QR code.')
        return
      }

      // Capture QR view (like drawing SVG to canvas)
      const uri = await captureQRCode() // must return a local image uri
      if (!uri) return

      const filename = `MediPass_QR_${Date.now()}.png`
      const fileUri = FileSystem.documentDirectory + filename

      // Move to app storage
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      })

      // Save to device gallery (actual "download")
      const asset = await MediaLibrary.createAssetAsync(fileUri)
      await MediaLibrary.createAlbumAsync('MediPass', asset, false)

      Alert.alert('Success', 'QR code saved to gallery!')

      // Optional: also open share dialog like web "save as"
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share QR Code',
        })
      }

    } catch (error) {
      console.error('Error downloading QR code:', error)
      Alert.alert('Error', 'Failed to download QR code')
    } finally {
      setSaving(false)
    }
  }


  const handleShare = async () => {
    setSaving(true)
    try {
      const uri = await captureQRCode()
      if (!uri) {
        setSaving(false)
        return
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync()
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share QR Code',
        })
      } else {
        Alert.alert('Error', 'Sharing is not available on this device')
      }
    } catch (error) {
      console.error('Error sharing QR code:', error)
      Alert.alert('Error', 'Failed to share QR code')
    } finally {
      setSaving(false)
    }
  }

  // Fallback QR component
  const FallbackQR = () => (
    <View style={styles.fallbackQR}>
      <Ionicons name="qr-code" size={120} color={colors.primary[600]} />
      <Text style={styles.fallbackQRText}>{qrValue}</Text>
      <Text style={styles.fallbackQRSubtext}>QR Code Display</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={styles.qrContainer}
        >
          <View style={styles.qrInnerContainer}>
            {QRCode ? (
              <QRCode
                value={qrValue}
                size={200}
                backgroundColor={colors.white}
                color={colors.primary[600]}
              />
            ) : (
              <FallbackQR />
            )}
          </View>
        </ViewShot>

        <Text style={styles.title}>Your MediPass QR</Text>
        <Text style={styles.subtitle}>Show this QR code to healthcare providers</Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeText} numberOfLines={1} ellipsizeMode="middle">
            {qrValue}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy"}
              size={20}
              color={copied ? colors.success[600] : colors.neutral[600]}
            />
          </TouchableOpacity>
        </View>

        { }

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleDownload}
            disabled={saving}
          >
            {saving ? (
              <>
                <Ionicons name="hourglass" size={20} color={colors.white} />
                <Text style={styles.buttonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="download" size={20} color={colors.white} />
                <Text style={styles.buttonText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, saving && styles.buttonDisabled]}
            onPress={handleShare}
            disabled={saving}
          >
            {saving ? (
              <>
                <Ionicons name="hourglass" size={20} color={colors.primary[600]} />
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Sharing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="share" size={20} color={colors.primary[600]} />
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success[600]} />
          <Text style={styles.securityText}>
            Secure & Private - Encrypted with healthcare standards
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  qrContainer: {
    width: 240,
    height: 240,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInnerContainer: {
    width: 240,
    height: 240,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    marginBottom: 24,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.primary[600],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.success[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success[100],
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: colors.neutral[700],
    flex: 1,
  },
  fallbackQR: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    gap: 8,
  },
  fallbackQRText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  fallbackQRSubtext: {
    fontSize: 10,
    color: colors.neutral[500],
  },
})

export default PatientQR

