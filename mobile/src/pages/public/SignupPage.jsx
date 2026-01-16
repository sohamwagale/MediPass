import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Image 
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'

const SignupPage = () => {
  const route = useRoute()
  const { role } = route.params || {}
  const { signup, isLoading } = useAuthStore()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: role || 'patient',
    licenseNumber: '',
    licenseCertificate: null, // Will store the file URI
  })
  const [uploadingCertificate, setUploadingCertificate] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }

    // Name validation
    if (formData.name.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid name')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    // Password validation
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    // Doctor-specific validation
    if (formData.role === 'doctor') {
      if (!formData.licenseNumber.trim()) {
        Alert.alert('Error', 'License number is required for doctors')
        return
      }
      if (!formData.licenseCertificate) {
        Alert.alert('Error', 'Please upload your medical license certificate')
        return
      }
    }

    try {
      const result = await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        licenseNumber: formData.role === 'doctor' ? formData.licenseNumber.trim() : undefined,
        licenseCertificate: formData.role === 'doctor' ? formData.licenseCertificate : undefined,
      })

      if (!result.success) {
        Alert.alert('Signup Failed', result.error || 'Please try again')
      }
      // Navigation happens automatically via AppNavigator when auth state changes
    } catch (error) {
      console.error('Signup error:', error)
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    }
  }

  const handlePickCertificate = async () => {
    try {
      setUploadingCertificate(true)
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        setFormData({ ...formData, licenseCertificate: asset.uri })
        Alert.alert('Success', 'License certificate selected')
      }
    } catch (error) {
      console.error('Error picking certificate:', error)
      Alert.alert('Error', 'Failed to select certificate. Please try again.')
    } finally {
      setUploadingCertificate(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={40} color={colors.white} />
          </View>
          <Text style={styles.title}>
            Join as a {formData.role === 'patient' ? 'Patient' : 'Doctor'}
          </Text>
          <Text style={styles.subtitle}>
            Create your {formData.role === 'patient' ? 'secure health record' : 'patient tracker'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="person" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Full Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your full name"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="mail" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Email *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text.trim() })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="call" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Phone (Optional)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-closed" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Password *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Create a password (min. 6 characters)"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="lock-closed" size={16} color={colors.neutral[700]} />
              <Text style={styles.label}>Confirm Password *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Doctor-specific fields */}
          {formData.role === 'doctor' && (
            <>
              {/* License Number Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="document-text" size={16} color={colors.neutral[700]} />
                  <Text style={styles.label}>Medical License Number *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.licenseNumber}
                  onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
                  placeholder="Enter your medical license number"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.helperText}>
                  Your license will be verified before account creation
                </Text>
              </View>

              {/* License Certificate Upload */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="image" size={16} color={colors.neutral[700]} />
                  <Text style={styles.label}>License Certificate *</Text>
                </View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickCertificate}
                  disabled={uploadingCertificate}
                >
                  {uploadingCertificate ? (
                    <ActivityIndicator color={colors.primary[600]} />
                  ) : (
                    <>
                      <Ionicons 
                        name={formData.licenseCertificate ? "checkmark-circle" : "cloud-upload"} 
                        size={20} 
                        color={formData.licenseCertificate ? colors.success[600] : colors.primary[600]} 
                      />
                      <Text style={styles.uploadButtonText}>
                        {formData.licenseCertificate ? 'Certificate Selected' : 'Upload Certificate Image'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {formData.licenseCertificate && (
                  <View style={styles.certificatePreview}>
                    <Ionicons name="document" size={24} color={colors.success[600]} />
                    <Text style={styles.certificateText} numberOfLines={1}>
                      Certificate ready to upload
                    </Text>
                    <TouchableOpacity
                      onPress={() => setFormData({ ...formData, licenseCertificate: null })}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error[600]} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color={colors.white} />
                <Text style={styles.submitButtonText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.neutral[900],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
    fontStyle: 'italic',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  certificatePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  certificateText: {
    flex: 1,
    fontSize: 14,
    color: colors.success[700],
    fontWeight: '500',
  },
})

export default SignupPage