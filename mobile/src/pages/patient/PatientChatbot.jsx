import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'
import { GoogleGenAI } from '@google/genai'

// 🖼️ Assets
import loadingGif from '../../../assets/images/loading-spinner.gif'
import robotImg from '../../../assets/images/robot.png'
import userImg from '../../../assets/images/user.png'

// 🔐 Gemini API
const GEMINI_API_KEY = 'AIzaSyA65oXZM6B5q8Xj0FVf4wEGT7SoyquD-h8'

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
})

async function run(prompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  })
  return response.text
}

const PatientChatbot = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = {
      sender: 'user',
      text: input,
      time: dayjs().format('h:mma'),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await run(input)

      const botMsg = {
        sender: 'bot',
        text: reply,
        time: dayjs().format('h:mma'),
      }

      setMessages(prev => [...prev, botMsg])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Unable to respond right now.',
          time: dayjs().format('h:mma'),
        },
      ])
    }

    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Navbar />

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble-ellipses" size={32} color={colors.primary[700]} />
          </View>
          <View>
            <Text style={styles.title}>AI Health Assistant</Text>
            <Text style={styles.subtitle}>
              Ask medical related questions
            </Text>
          </View>
        </View>

        {/* Chat Card */}
        <View style={styles.card}>
          {messages.length === 0 && (
            <Text style={styles.welcome}>
              👋 Hi! I’m your AI health assistant.
            </Text>
          )}

          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageRow,
                msg.sender === 'user' ? styles.rowUser : styles.rowBot,
              ]}
            >
              {msg.sender === 'bot' && (
                <Image source={robotImg} style={styles.avatar} />
              )}

              <View
                style={[
                  styles.messageBubble,
                  msg.sender === 'user'
                    ? styles.userBubble
                    : styles.botBubble,
                ]}
              >
                <Text style={styles.messageText}>{msg.text}</Text>
                <Text style={styles.time}>{msg.time}</Text>
              </View>

              {msg.sender === 'user' && (
                <Image source={userImg} style={styles.avatar} />
              )}
            </View>
          ))}

          {loading && (
            <View style={styles.loading}>
              <Image source={loadingGif} style={styles.loadingGif} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Ask something..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: { flex: 1 },
  contentContainer: {
    padding: 24,
    gap: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },

  welcome: {
    textAlign: 'center',
    color: colors.neutral[600],
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowBot: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  messageBubble: {
    maxWidth: '70%',
    padding: 14,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: colors.primary[600],
  },
  botBubble: {
    backgroundColor: colors.neutral[100],
  },

  messageText: {
    fontSize: 15,
    color: colors.neutral[900],
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    color: colors.neutral[500],
    textAlign: 'right',
  },

  loading: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingGif: {
    width: 40,
    height: 40,
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: colors.primary[600],
    padding: 14,
    borderRadius: 12,
  },
})

export default PatientChatbot