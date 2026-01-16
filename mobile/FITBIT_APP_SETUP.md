# Fitbit App Registration - Complete Guide

## Step-by-Step Instructions

### 1. Go to Fitbit Developer Portal
Visit: https://dev.fitbit.com/apps/new

### 2. Fill in the Application Details

#### Required Fields:

**Application Name** *
```
MediPass Health Sync
```
(Or any name you prefer)

**Description** *
```
Mobile health application for syncing patient fitness data from Fitbit devices. Allows patients to connect their Fitbit accounts and sync daily steps and calories burned to their medical profile.
```

**Application Website URL** *
```
https://medipass.com
```
(Or your actual website URL - can be a placeholder if you don't have one)

**Organization** *
```
MediPass
```
(Or your organization name)

**Organization Website URL** *
```
https://medipass.com
```
(Or your organization website - can be same as Application Website)

**Terms of Service URL** *
```
https://medipass.com/terms
```
(Or your terms of service URL - can be a placeholder)

**Privacy Policy URL** *
```
https://medipass.com/privacy
```
(Or your privacy policy URL - can be a placeholder)

#### Critical Settings:

**OAuth 2.0 Application Type** *
```
☑ Server
```
⚠️ **IMPORTANT**: Select **"Server"** (NOT "Personal" or "Client")
- "Personal" apps only work for the app owner
- "Server" apps work for any user (what we need)
- "Client" apps are for public clients without a secret

**Redirect URL** *
```
exp://wq_ft60-soham_wagale-8081.exp.direct
```
⚠️ **Note**: This is your current Expo development URL. It may change when you restart Expo.
- For development: Use the Expo URL shown when you run `npx expo start`
- For production: Use `medipass://fitbit-callback`

**Default Access Type** *
```
☑ Read Only
```
(Recommended for health data - we only need to read steps and calories)

### 3. After Creating the App

1. **Copy your credentials:**
   - **OAuth 2.0 Client ID**: (e.g., `23TW67`)
   - **Client Secret**: Click "Show" to reveal it

2. **Update `src/services/fitbit.js`:**
   ```javascript
   const FITBIT_CLIENT_ID = 'your-client-id-here'
   const FITBIT_CLIENT_SECRET = 'your-client-secret-here'
   ```

3. **Update the redirect URI** in `src/services/fitbit.js` to match what's in Fitbit settings:
   ```javascript
   const FITBIT_REDIRECT_URI = 'exp://wq_ft60-soham_wagale-8081.exp.direct'
   ```

### 4. Common Issues

#### Issue: "Personal application is only authorized to request access tokens from the owner"
**Solution**: Delete the app and create a new one with **"Server"** as the OAuth 2.0 Application Type.

#### Issue: Redirect URI mismatch
**Solution**: 
- Check the exact redirect URI in Fitbit app settings
- Make sure it matches exactly in `src/services/fitbit.js`
- For Expo, the URI changes when you restart - update both places

#### Issue: Invalid client_id
**Solution**: 
- Make sure you copied the Client ID correctly
- No extra spaces or quotes
- Restart Expo after updating

### 5. For Production

When building for production:

1. **Update redirect URI in Fitbit settings:**
   ```
   medipass://fitbit-callback
   ```

2. **Update `src/services/fitbit.js`:**
   ```javascript
   const FITBIT_REDIRECT_URI = 'medipass://fitbit-callback'
   ```

3. **Consider using a backend proxy** to securely handle the client secret instead of storing it in the app.
