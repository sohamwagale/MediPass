# Fitbit Integration Setup Guide

## Prerequisites

1. Create a Fitbit Developer Account at https://dev.fitbit.com/
2. Register a new application at https://dev.fitbit.com/apps/new

## Configuration Steps

### 1. Get Fitbit App Credentials

1. Go to https://dev.fitbit.com/apps
2. Click "Register a New App"
3. Fill in the application details:
   - **Application Name**: MediPass (or your app name)
   - **Description**: Health data sync for patients
   - **Application Website**: Your website URL
   - **Organization**: Your organization name
   - **Organization Website**: Your organization website
   - **OAuth 2.0 Application Type**: Personal
   - **Callback URL**: `medipass://fitbit-callback`
   - **Default Access Type**: Read Only (recommended for health data)

4. After creating the app, note down:
   - **OAuth 2.0 Client ID**
   - **Client Secret** (click "Show" to reveal)

### 2. Configure the App

1. Open `src/services/fitbit.js`
2. Find these lines (around line 10-11):
   ```javascript
   const FITBIT_CLIENT_ID = 'YOUR_FITBIT_CLIENT_ID'
   const FITBIT_CLIENT_SECRET = 'YOUR_FITBIT_CLIENT_SECRET'
   ```

3. Replace `YOUR_FITBIT_CLIENT_ID` with your actual Client ID:
   ```javascript
   const FITBIT_CLIENT_ID = 'your-actual-client-id-here'
   ```
   ⚠️ **Important**: Remove the quotes and placeholder text, but keep the quotes around your actual Client ID.

4. Replace `YOUR_FITBIT_CLIENT_SECRET` with your actual Client Secret:
   ```javascript
   const FITBIT_CLIENT_SECRET = 'your-actual-client-secret-here'
   ```
   ⚠️ **Important**: Remove the quotes and placeholder text, but keep the quotes around your actual Client Secret.

5. **Save the file** after making changes.

6. **Restart the Expo development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npx expo start --clear
   ```

### 3. Update Redirect URI in Fitbit App Settings

1. Go back to your Fitbit app settings
2. Ensure the Callback URL matches: `medipass://fitbit-callback`
3. For Expo development, you may also need to add:
   - `exp://localhost:8081/--/fitbit-callback` (for Expo Go)
   - Or use the actual redirect URI printed in the console when running the app

### 4. App.json Configuration

The app.json file has been configured with:
- iOS scheme: `medipass`
- Android scheme: `medipass`

This matches the redirect URI in the Fitbit service.

## Security Note

⚠️ **Important for Production**: 

Storing the `FITBIT_CLIENT_SECRET` in the mobile app is **not secure** for production applications. For production:

1. **Recommended Approach**: Create a backend proxy server that:
   - Stores the client secret securely
   - Handles the OAuth token exchange
   - Returns tokens to the mobile app

2. **Alternative**: Use environment variables or secure configuration management

## Testing

1. Run the app: `npx expo start`
2. Navigate to Patient Profile
3. Tap "Connect Fitbit"
4. Complete the OAuth flow in the browser
5. Grant permissions for activity and nutrition data
6. Return to the app
7. Tap "Sync Health Data" to fetch today's steps and calories

## Troubleshooting

### Error: "Invalid redirect_uri"

- Ensure the redirect URI in Fitbit app settings exactly matches `medipass://fitbit-callback`
- Check that the scheme is configured in app.json

### Error: "Invalid client credentials"

- Verify your Client ID and Client Secret are correct
- Ensure there are no extra spaces or quotes

### Error: "Authorization failed"

- Check that the app has the correct OAuth scopes (`activity`, `nutrition`)
- Verify the redirect URI is correctly configured

### Token Exchange Fails

- For development, storing client secret in the app is acceptable
- For production, implement a backend proxy for secure token exchange

## Firebase Integration

Health data is automatically synced to Firebase under:
```
users/{patientId}/healthData
```

Contains:
- `steps`: Number of steps today
- `calories`: Calories burned today
- `date`: Date of the data (YYYY-MM-DD format)
- `lastSynced`: Timestamp of last sync
