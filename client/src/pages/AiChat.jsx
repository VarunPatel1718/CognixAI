import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import { Send, MessageCircle, Trash2, Copy, Download } from 'lucide-react'

const AiChat = () => {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const suggestions = [
    "Write a Python function",
    "Explain machine learning",  
    "Help me write an email",
    "What is React?"
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return

    const userMessage = { role: 'user', content: messageText.trim() }
    const newMessages = [...messages, userMessage]
    
    setMessages(newMessages)
    setInputMessage('')
    setLoading(true)
    setError('')

    try {
      const token = await getToken()
      
      const response = await axios.post(
        'http://localhost:3000/api/ai/chat',
        {
          messages: newMessages
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        const aiMessage = { role: 'assistant', content: response.data.content }
        setMessages([...newMessages, aiMessage])
      } else {
        setError(response.data.message || 'Failed to get response')
      }
    } catch (err) {
      setError('Failed to send message: ' + err.message)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSendMessage = () => {
    sendMessage(inputMessage)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion)
  }

  const clearChat = () => {
    setMessages([])
    setError('')
    inputRef.current?.focus()
  }

  const copyMessage = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const downloadMessage = (text) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cognixai-response.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadFullChat = () => {
    const chatText = messages.map(msg => 
      msg.role === 'user' 
        ? `You: ${msg.content}` 
        : `CognixAI: ${msg.content}` 
    ).join('\n\n---\n\n')
    
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cognixai-chat.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">CognixAI Assistant</h1>
            <p className="text-sm text-slate-400">Ask me anything!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadFullChat}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title="Download full chat"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">CognixAI Assistant</h2>
            <p className="text-slate-300 mb-8 max-w-md">
              Ask me anything! I can help with coding, writing, analysis and more.
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center max-w-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 rounded-full text-sm hover:text-slate-100 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-3 max-w-3xl ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {message.role === 'user' ? (
                      <img 
                        src={user?.imageUrl} 
                        alt="User" 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <span className="text-white text-sm">🤖</span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className="relative group">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'text-white'
                          : 'text-slate-200'
                      }`}
                      style={{
                        background: message.role === 'user'
                          ? 'linear-gradient(135deg, #7c3aed, #0d9488)'
                          : 'rgba(255,255,255,0.06)',
                        border: message.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        borderRadius: '16px'
                      }}
                    >
                      <p className="text-sm leading-relaxed">
                        {formatMessage(message.content)}
                      </p>
                    </div>

                    {/* Copy and Download Buttons - Only for AI Messages */}
                    {message.role === 'assistant' && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <button
                            onClick={() => copyMessage(message.content, index)}
                            className="p-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            title="Copy message"
                          >
                            {copiedIndex === index ? (
                              <span className="text-xs">✓</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => downloadMessage(message.content)}
                            className="p-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            title="Download message"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-end gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md">
                  <p className="text-sm">❌ {error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4" style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 border rounded-xl resize-none focus:outline-none text-slate-200 placeholder-slate-500"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                minHeight: '48px',
                maxHeight: '120px',
                resize: 'none'
              }}
              rows={1}
              disabled={loading}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="px-4 py-3 text-white rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #0d9488)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AiChat
