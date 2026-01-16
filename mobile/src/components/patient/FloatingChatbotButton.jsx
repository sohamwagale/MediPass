import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'

const FloatingChatbotButton = () => {
  const navigation = useNavigation()

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => navigation.navigate('PatientChatbot')}
      activeOpacity={0.8}
    >
      <Ionicons name="chatbubble-ellipses" size={28} color={colors.white} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 20, // Position above tab bar (tab bar height is ~70 + some spacing)
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
})

export default FloatingChatbotButton
