// Base color palette (light mode)
const lightColors = {
  white: '#FFFFFF',
  black: '#000000',
  grey: '#F5F5F5',
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
  }
}

// Dark mode color palette
const darkColors = {
  white: '#000000',
  black: '#FFFFFF',
  grey: '#1A1A1A',
  neutral: {
    50: '#171717',
    100: '#262626',
    200: '#404040',
    300: '#525252',
    400: '#737373',
    500: '#a3a3a3',
    600: '#d4d4d4',
    700: '#e5e5e5',
    800: '#f5f5f5',
    900: '#fafafa',
  },
  primary: {
    50: '#0369a1',
    100: '#0284c7',
    200: '#0ea5e9',
    300: '#38bdf8',
    400: '#7dd3fc',
    500: '#bae6fd',
    600: '#0ea5e9',
    700: '#38bdf8',
  },
  success: {
    50: '#15803d',
    100: '#16a34a',
    200: '#22c55e',
    300: '#4ade80',
    400: '#86efac',
    500: '#bbf7d0',
    600: '#16a34a',
    700: '#22c55e',
  },
  error: {
    50: '#7f1d1d',
    500: '#EF4444',
    600: '#DC2626',
  }
}

// Get theme-aware colors
export const getColors = (isDarkMode = false) => {
  return isDarkMode ? darkColors : lightColors
}

// Default export for backward compatibility (light mode)
export const colors = lightColors
