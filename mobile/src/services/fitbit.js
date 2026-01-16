// services/fitbit.js
import * as AuthSession from 'expo-auth-session'
import * as SecureStore from 'expo-secure-store'

// Fitbit OAuth Configuration
// IMPORTANT: Get your credentials from https://dev.fitbit.com/apps
// Set your OAuth 2.0 Redirect URI in Fitbit app settings to match the redirect URI below
// 
// STEP 1: Create a Fitbit app at https://dev.fitbit.com/apps/new
// STEP 2: Get your Client ID and Client Secret
// STEP 3: Replace the values below with your actual credentials
// STEP 4: Create a NEW Fitbit app with "Server" type (NOT "Personal")
// STEP 5: Set the Callback URL in Fitbit app settings to match FITBIT_REDIRECT_URI below
// STEP 6: Copy the new Client ID and Client Secret from the new app
//
// ⚠️ IMPORTANT: Delete your old "Personal" app and create a new "Server" type app
// Personal apps only work for the app owner, Server apps work for all users
//
const FITBIT_CLIENT_ID = '23TW8T' // ⚠️ Get from NEW "Server" type app
// Note: For production, consider using a backend proxy to handle client secret securely
const FITBIT_CLIENT_SECRET = '59c8f1b4cbf55bdface563f7484ddb2c' // ⚠️ Get from NEW "Server" type app

// Redirect URI configuration
// IMPORTANT: This must match EXACTLY what's configured in your Fitbit app settings
// 
// Option 1: Use the exact redirect URI from Fitbit settings (recommended for development)
const FITBIT_REDIRECT_URI = 'exp://wq_ft60-soham_wagale-8081.exp.direct'

// Option 2: Use makeRedirectUri (uncomment if Option 1 doesn't work)
// const FITBIT_REDIRECT_URI = AuthSession.makeRedirectUri({
//   scheme: 'exp',
//   path: 'fitbit-callback',
// })

// Note: 
// - For Expo Go: Use the exact URI from Fitbit settings (Option 1)
// - For production builds: Use 'medipass://fitbit-callback' and update Fitbit settings
// - If you restart Expo dev server, the URI might change - update Fitbit settings if needed

// Fitbit API endpoints
const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize'
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token'
const FITBIT_API_BASE = 'https://api.fitbit.com/1'

// Storage keys
const FITBIT_ACCESS_TOKEN_KEY = 'fitbit_access_token'
const FITBIT_REFRESH_TOKEN_KEY = 'fitbit_refresh_token'
const FITBIT_USER_ID_KEY = 'fitbit_user_id'
const FITBIT_EXPIRES_AT_KEY = 'fitbit_expires_at'

/**
 * Get Fitbit OAuth discovery document
 */
const discovery = {
  authorizationEndpoint: FITBIT_AUTH_URL,
  tokenEndpoint: FITBIT_TOKEN_URL,
}

/**
 * Validate Fitbit configuration
 */
const validateFitbitConfig = () => {
  if (!FITBIT_CLIENT_ID || FITBIT_CLIENT_ID === 'YOUR_FITBIT_CLIENT_ID') {
    return {
      valid: false,
      error: 'Fitbit Client ID not configured. Please set FITBIT_CLIENT_ID in src/services/fitbit.js with your Client ID from https://dev.fitbit.com/apps',
    }
  }
  if (!FITBIT_CLIENT_SECRET || FITBIT_CLIENT_SECRET === 'YOUR_FITBIT_CLIENT_SECRET') {
    return {
      valid: false,
      error: 'Fitbit Client Secret not configured. Please set FITBIT_CLIENT_SECRET in src/services/fitbit.js with your Client Secret from https://dev.fitbit.com/apps',
    }
  }
  return { valid: true }
}

/**
 * Request OAuth 2.0 authorization from Fitbit
 */
export const authorizeFitbit = async () => {
  try {
    // Validate configuration first
    const validation = validateFitbitConfig()
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const request = new AuthSession.AuthRequest({
      clientId: FITBIT_CLIENT_ID,
      scopes: ['activity', 'nutrition'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: FITBIT_REDIRECT_URI,
      usePKCE: false, // Fitbit doesn't support PKCE
      additionalParameters: {
        expires_in: '31536000', // 1 year
      },
    })

    const result = await request.promptAsync(discovery)

    if (result.type === 'success') {
      const { code } = result.params

      // Exchange authorization code for access token
      // Note: Fitbit requires client_secret. For production apps, use a backend proxy.
      // This implementation includes client_secret for development/testing only.
      const credentials = `${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET || ''}`
      // Use btoa for base64 encoding (available in React Native)
      const basicAuth = btoa(credentials)
      
      const tokenResponse = await fetch(FITBIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: FITBIT_REDIRECT_URI,
          client_id: FITBIT_CLIENT_ID,
        }).toString(),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${error}`)
      }

      const tokens = await tokenResponse.json()
      
      // Store tokens securely
      await SecureStore.setItemAsync(FITBIT_ACCESS_TOKEN_KEY, tokens.access_token)
      await SecureStore.setItemAsync(FITBIT_REFRESH_TOKEN_KEY, tokens.refresh_token)
      await SecureStore.setItemAsync(FITBIT_USER_ID_KEY, tokens.user_id)
      
      const expiresAt = Date.now() + tokens.expires_in * 1000
      await SecureStore.setItemAsync(FITBIT_EXPIRES_AT_KEY, expiresAt.toString())

      return {
        success: true,
        userId: tokens.user_id,
      }
    } else {
      return {
        success: false,
        error: result.type === 'cancel' ? 'User cancelled authorization' : 'Authorization failed',
      }
    }
  } catch (error) {
    console.error('Fitbit authorization error:', error)
    return {
      success: false,
      error: error.message || 'Failed to authorize Fitbit',
    }
  }
}

/**
 * Get stored access token
 */
export const getFitbitAccessToken = async () => {
  try {
    const token = await SecureStore.getItemAsync(FITBIT_ACCESS_TOKEN_KEY)
    return token
  } catch (error) {
    console.error('Error getting Fitbit token:', error)
    return null
  }
}

/**
 * Check if Fitbit is connected
 */
export const isFitbitConnected = async () => {
  const token = await getFitbitAccessToken()
  if (!token) return false

  // Check if token is expired
  try {
    const expiresAt = await SecureStore.getItemAsync(FITBIT_EXPIRES_AT_KEY)
    if (expiresAt && Date.now() >= parseInt(expiresAt, 10)) {
      // Token expired, try to refresh
      const refreshed = await refreshFitbitToken()
      return refreshed
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * Refresh Fitbit access token
 */
export const refreshFitbitToken = async () => {
  try {
    const refreshToken = await SecureStore.getItemAsync(FITBIT_REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      return false
    }

      const credentials = `${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET || ''}`
      const basicAuth = btoa(credentials)
      
      const response = await fetch(FITBIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      })

    if (!response.ok) {
      return false
    }

    const tokens = await response.json()
    
    await SecureStore.setItemAsync(FITBIT_ACCESS_TOKEN_KEY, tokens.access_token)
    if (tokens.refresh_token) {
      await SecureStore.setItemAsync(FITBIT_REFRESH_TOKEN_KEY, tokens.refresh_token)
    }
    
    const expiresAt = Date.now() + tokens.expires_in * 1000
    await SecureStore.setItemAsync(FITBIT_EXPIRES_AT_KEY, expiresAt.toString())

    return true
  } catch (error) {
    console.error('Error refreshing Fitbit token:', error)
    return false
  }
}

/**
 * Disconnect Fitbit (remove stored tokens)
 */
export const disconnectFitbit = async () => {
  try {
    await SecureStore.deleteItemAsync(FITBIT_ACCESS_TOKEN_KEY)
    await SecureStore.deleteItemAsync(FITBIT_REFRESH_TOKEN_KEY)
    await SecureStore.deleteItemAsync(FITBIT_USER_ID_KEY)
    await SecureStore.deleteItemAsync(FITBIT_EXPIRES_AT_KEY)
    return true
  } catch (error) {
    console.error('Error disconnecting Fitbit:', error)
    return false
  }
}

/**
 * Make authenticated API request to Fitbit
 */
const fitbitApiRequest = async (endpoint) => {
  const token = await getFitbitAccessToken()
  if (!token) {
    throw new Error('Not authenticated with Fitbit')
  }

  // Check if token needs refresh
  const expiresAt = await SecureStore.getItemAsync(FITBIT_EXPIRES_AT_KEY)
  if (expiresAt && Date.now() >= parseInt(expiresAt, 10)) {
    const refreshed = await refreshFitbitToken()
    if (!refreshed) {
      throw new Error('Token expired and refresh failed')
    }
  }

  const response = await fetch(`${FITBIT_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${await getFitbitAccessToken()}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, try refresh
      const refreshed = await refreshFitbitToken()
      if (refreshed) {
        // Retry request
        return fitbitApiRequest(endpoint)
      }
    }
    throw new Error(`Fitbit API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get today's steps from Fitbit
 */
export const getTodaySteps = async () => {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const data = await fitbitApiRequest(`/user/-/activities/steps/date/${today}/1d.json`)
    
    if (data['activities-steps'] && data['activities-steps'].length > 0) {
      return parseInt(data['activities-steps'][0].value, 10) || 0
    }
    return 0
  } catch (error) {
    console.error('Error fetching steps:', error)
    throw error
  }
}

/**
 * Get today's calories burned from Fitbit
 */
export const getTodayCalories = async () => {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const data = await fitbitApiRequest(`/user/-/activities/calories/date/${today}/1d.json`)
    
    if (data['activities-calories'] && data['activities-calories'].length > 0) {
      return parseInt(data['activities-calories'][0].value, 10) || 0
    }
    return 0
  } catch (error) {
    console.error('Error fetching calories:', error)
    throw error
  }
}

/**
 * Sync today's health data (steps + calories) from Fitbit
 */
export const syncTodayHealthData = async () => {
  try {
    const isConnected = await isFitbitConnected()
    if (!isConnected) {
      throw new Error('Fitbit not connected')
    }

    const [steps, calories] = await Promise.all([
      getTodaySteps(),
      getTodayCalories(),
    ])

    return {
      success: true,
      steps,
      calories,
      date: new Date().toISOString().split('T')[0],
    }
  } catch (error) {
    console.error('Error syncing health data:', error)
    return {
      success: false,
      error: error.message || 'Failed to sync health data',
    }
  }
}
