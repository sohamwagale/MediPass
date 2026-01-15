import { create } from "zustand"
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../firebase"

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,
  isLoading: false,

  initializeAuth: async () => {
    if (!auth || !db) {
      set({ loading: false })
      return
    }

    try {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          set({ user: null, token: null, loading: false })
          return
        }

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
                name: userData.name || '',
                phone: userData.phone || '',
                role: userData.role || 'patient',
                ...userData
              },
              token,
              loading: false
            })
          } else {
            set({ user: null, token: null, loading: false })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          set({ user: null, token: null, loading: false })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ user: null, token: null, loading: false })
    }
  },

  login: async (email, password, role) => {
    set({ isLoading: true })
    try {
      if (!auth || !db) {
        throw new Error('Firebase not initialized')
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
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
          name: userData.name || '',
          phone: userData.phone || '',
          role: userData.role,
          ...userData
        },
        token,
        isLoading: false
      })

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
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

      set({ isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  signup: async (data) => {
    set({ isLoading: true })
    try {
      if (!auth || !db) {
        throw new Error('Firebase not initialized')
      }

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
        role: data.role || 'patient',
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
          role: data.role || 'patient',
          ...userData
        },
        token,
        isLoading: false
      })

      return { success: true }
    } catch (error) {
      console.error('Signup error:', error)
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

      set({ isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  logout: async () => {
    try {
      if (auth) {
        await signOut(auth)
      }
      set({ user: null, token: null })
    } catch (error) {
      console.error('Logout error:', error)
      set({ user: null, token: null })
    }
  }
}))
