// stores/authStore.js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import Firebase
import { auth, db, storage } from '../services/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import * as FileSystem from 'expo-file-system/legacy'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      /**
       * Initialize authentication state
       * Sets up Firebase auth listener or validates existing session
       */
      initializeAuth: async () => {
        // If Firebase is not available, check for stored session
        if (!auth || !db) {
          const { token } = get()
          if (token) {
            console.log('🔄 Using stored mock authentication')
          }
          return
        }

        try {
          // Set up auth state listener
          onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              try {
                // Get user data from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid)
                const userDoc = await getDoc(userDocRef)

                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  const token = await firebaseUser.getIdToken()

                  set({
                    user: {
                      id: firebaseUser.uid,
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      name: userData.name,
                      phone: userData.phone || '',
                      role: userData.role,
                      ...userData
                    },
                    token
                  })
                  console.log('✅ User authenticated:', userData.role)
                } else {
                  console.warn('⚠️ User document not found')
                  set({ user: null, token: null })
                }
              } catch (error) {
                console.error('❌ Error fetching user data:', error)
                set({ user: null, token: null })
              }
            } else {
              // User signed out
              set({ user: null, token: null })
            }
          })
        } catch (error) {
          console.error('❌ Error initializing auth:', error)
          set({ user: null, token: null })
        }
      },

      /**
       * Login with email and password
       */
      login: async (email, password, role) => {
        set({ isLoading: true })
        try {
          // Fallback to mock login if Firebase not available
          if (!auth || !db) {
            console.log('🔄 Using mock login')
            const mockUser = {
              id: 'mock_' + Date.now(),
              uid: 'mock_' + Date.now(),
              name: 'Mock User',
              email,
              phone: '',
              role
            }
            const mockToken = 'mock_token_' + Date.now()
            set({ user: mockUser, token: mockToken })
            return { success: true }
          }

          // Firebase authentication
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          )
          const firebaseUser = userCredential.user

          // Get user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (!userDoc.exists()) {
            await signOut(auth)
            throw new Error('User data not found. Please sign up first.')
          }

          const userData = userDoc.data()

          // Verify role matches
          if (userData.role !== role) {
            await signOut(auth)
            throw new Error(`Invalid role. This account is registered as ${userData.role}`)
          }

          const token = await firebaseUser.getIdToken()

          set({
            user: {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name,
              phone: userData.phone || '',
              role: userData.role,
              ...userData
            },
            token
          })

          console.log('✅ Login successful:', userData.role)
          return { success: true }
        } catch (error) {
          console.error('❌ Login error:', error)
          let errorMessage = 'Login failed. Please check your credentials.'

          if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.'
          } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.'
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.'
          } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.'
          } else if (error.message) {
            errorMessage = error.message
          }

          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },

      /**
       * Verify doctor license number
       */
      verifyLicense: async (licenseNumber) => {
        try {
          if (!db) {
            throw new Error('Database not available')
          }

          // Query the license collection for matching license number
          const licenseRef = collection(db, 'license')
          const q = query(licenseRef, where('licenseNumber', '==', licenseNumber.trim()))
          const querySnapshot = await getDocs(q)

          if (querySnapshot.empty) {
            return { success: false, error: 'License number not found in our database' }
          }

          // License found
          const licenseDoc = querySnapshot.docs[0]
          const licenseData = licenseDoc.data()
          
          return { 
            success: true, 
            licenseData: {
              id: licenseDoc.id,
              ...licenseData
            }
          }
        } catch (error) {
          console.error('❌ License verification error:', error)
          return { 
            success: false, 
            error: error.message || 'Failed to verify license. Please try again.' 
          }
        }
      },

      /**
       * Upload license certificate to Firebase Storage
       */
      uploadLicenseCertificate: async (fileUri, userId) => {
        try {
          if (!storage || !fileUri) {
            throw new Error('Storage not available or file URI missing')
          }

          // Read the file
          const fileInfo = await FileSystem.getInfoAsync(fileUri)
          if (!fileInfo.exists) {
            throw new Error('File does not exist')
          }

          // Create a blob from the file
          const response = await fetch(fileUri)
          const blob = await response.blob()

          // Upload to Firebase Storage
          const fileName = `license_certificates/${userId}_${Date.now()}.jpg`
          const storageRef = ref(storage, fileName)
          await uploadBytes(storageRef, blob)

          // Get download URL
          const downloadURL = await getDownloadURL(storageRef)
          
          return { success: true, downloadURL }
        } catch (error) {
          console.error('❌ Certificate upload error:', error)
          return { 
            success: false, 
            error: error.message || 'Failed to upload certificate. Please try again.' 
          }
        }
      },

      /**
       * Sign up new user
       */
      signup: async (data) => {
        set({ isLoading: true })
        try {
          // Fallback to mock signup if Firebase not available
          if (!auth || !db) {
            console.log('🔄 Using mock signup')
            const mockUser = {
              id: 'mock_' + Date.now(),
              uid: 'mock_' + Date.now(),
              name: data.name,
              email: data.email,
              phone: data.phone || '',
              role: data.role || 'patient'
            }
            const mockToken = 'mock_token_' + Date.now()
            set({ user: mockUser, token: mockToken })
            return { success: true }
          }

          // Doctor-specific verification
          if (data.role === 'doctor') {
            // Verify license number
            if (!data.licenseNumber) {
              return { 
                success: false, 
                error: 'License number is required for doctor registration' 
              }
            }

            // Verify license (call the method from the store)
            const licenseVerification = await get().verifyLicense(data.licenseNumber)

            if (!licenseVerification.success) {
              return { 
                success: false, 
                error: licenseVerification.error || 'License verification failed' 
              }
            }

            // Upload license certificate if provided
            let certificateURL = null
            if (data.licenseCertificate) {
              // We need to create a temporary user ID for the upload
              // We'll use email as a temporary identifier
              const tempUserId = data.email.replace(/[^a-zA-Z0-9]/g, '_')
              const uploadResult = await get().uploadLicenseCertificate(
                data.licenseCertificate, 
                tempUserId
              )
              
              if (!uploadResult.success) {
                return { 
                  success: false, 
                  error: uploadResult.error || 'Failed to upload certificate' 
                }
              }
              
              certificateURL = uploadResult.downloadURL
            }

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              data.email,
              data.password
            )
            const firebaseUser = userCredential.user

            // Re-upload certificate with actual user ID if needed
            if (data.licenseCertificate && certificateURL) {
              // Certificate already uploaded, but we can update the path if needed
              // For now, we'll keep the original upload
            }

            // Prepare user data for Firestore
            const userData = {
              name: data.name,
              email: data.email,
              phone: data.phone || '',
              role: 'doctor',
              licenseNumber: data.licenseNumber.trim(),
              licenseCertificateURL: certificateURL,
              verified: true, // License verified
              createdAt: serverTimestamp()
            }

            // Save to Firestore
            const userDocRef = doc(db, 'users', firebaseUser.uid)
            await setDoc(userDocRef, userData)

            const token = await firebaseUser.getIdToken()

            set({
              user: {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: data.name,
                phone: data.phone || '',
                role: 'doctor',
                ...userData
              },
              token
            })

            console.log('✅ Doctor signup successful with verified license')
            return { success: true }
          } else {
            // Patient signup (no verification needed)
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          )
          const firebaseUser = userCredential.user

          // Prepare user data for Firestore
          const userData = {
            name: data.name,
            email: data.email,
            phone: data.phone || '',
              role: 'patient',
            createdAt: serverTimestamp()
          }

          // Save to Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          await setDoc(userDocRef, userData)

          const token = await firebaseUser.getIdToken()

          set({
            user: {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: data.name,
              phone: data.phone || '',
                role: 'patient',
              ...userData
            },
            token
          })

            console.log('✅ Patient signup successful')
          return { success: true }
          }
        } catch (error) {
          console.error('❌ Signup error:', error)
          let errorMessage = 'Signup failed. Please try again.'

          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already registered. Please login instead.'
          } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.'
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.'
          } else if (error.message) {
            errorMessage = error.message
          }

          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        try {
          if (auth) {
            await signOut(auth)
          }

          set({ user: null, token: null })
          await AsyncStorage.removeItem('medipass-auth')
          console.log('✅ Logout successful')
        } catch (error) {
          console.error('❌ Logout error:', error)
          // Still clear local state even if Firebase signout fails
          set({ user: null, token: null })
          await AsyncStorage.removeItem('medipass-auth')
        }
      }
    }),
    {
      name: 'medipass-auth',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)