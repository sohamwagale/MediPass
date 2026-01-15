import React, { useState, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import { IoSend } from 'react-icons/io5'
import { GoogleGenAI } from '@google/genai'

import Navbar from '../../components/common/Navbar'
import { colors } from '../../constants/colors'

import loadingGif from '../../assets/loading-spinner.gif'
import robotImg from '../../assets/robot.png'
import userImg from '../../assets/user.png'

import './PatientChatbot.css'

const GEMINI_API_KEY = 'AIzaSyByiitOM69fxzR-eBTFP31CUtqk9HUpCG8'

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

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
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
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
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: reply, time: dayjs().format('h:mma') },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Unable to respond right now.', time: dayjs().format('h:mma') },
      ])
    }

    setLoading(false)
  }

  return (
    <div className="chat-wrapper">
      {/* Chat container */}
      <div className="chat-main">
        {/* Scrollable messages */}
        <div className="chat-messages" ref={scrollRef}>
          <div className="chat-header">
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h1>AI Health Assistant</h1>
              <p>Ask medical related questions</p>
            </div>
          </div>

          <div className="chat-card">
            {messages.length === 0 && (
              <p className="welcome">👋 Hi! I’m your AI health assistant.</p>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.sender}`}>
                {msg.sender === 'bot' && <img src={robotImg} className="avatar" />}
                <div className={`bubble ${msg.sender}`}>
                  <p>{msg.text}</p>
                  <span>{msg.time}</span>
                </div>
                {msg.sender === 'user' && <img src={userImg} className="avatar" />}
              </div>
            ))}

            {loading && (
              <div className="loading">
                <img src={loadingGif} alt="loading" />
              </div>
            )}
          </div>
        </div>

        {/* Fixed input bar */}
        <div className="input-bar">
          <input
            placeholder="Ask something..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>
            <IoSend size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PatientChatbot
