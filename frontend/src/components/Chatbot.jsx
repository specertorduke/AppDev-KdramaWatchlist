import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronDown, MessageSquare, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import chatbotService from '../services/chatbotService.js'

const INITIAL_MESSAGE = {
  id: 'init-greeting',
  sender: 'ai',
  text: "Annyeong! I'm your K-Drama AI assistant. Ask me for recommendations based on your watchlist!",
  timestamp: Date.now(),
}

const QUICK_PROMPTS = [
  'Recommend a short bingeable thriller',
  'Something heartwarming like Hometown Cha-Cha-Cha',
  'Historical dramas with high romance',
]

export default function Chatbot() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(() => {
    return sessionStorage.getItem('sarangtv_chat_open') === 'true'
  })

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sarangtv_chat_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Fallback
    }
    return [INITIAL_MESSAGE]
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastFailedMessage, setLastFailedMessage] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Persist open/close state
  useEffect(() => {
    sessionStorage.setItem('sarangtv_chat_open', isOpen ? 'true' : 'false')
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Persist messages history in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('sarangtv_chat_history', JSON.stringify(messages))
    } catch {
      // Storage full
    }
  }, [messages])

  // Auto-scroll on new message or loading state change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, isOpen])

  const handleSendMessage = async (textToSend) => {
    const trimmed = (textToSend || input).trim()
    if (trimmed.length < 2 || trimmed.length > 500 || loading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setLastFailedMessage(null)

    try {
      const reply = await chatbotService.sendMessage(trimmed)

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorText = err.message || "Sorry, I couldn't connect to the AI assistant right now. Please try again."

      // Check if unauthorized 401
      const isAuthError = errorText.toLowerCase().includes('session has expired') || errorText.toLowerCase().includes('log in again')

      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: errorText,
        isError: true,
        isAuthError,
        originalPrompt: trimmed,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, errorMessage])
      setLastFailedMessage(trimmed)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRetry = (promptToRetry) => {
    if (promptToRetry) {
      handleSendMessage(promptToRetry)
    }
  }

  const handleClearHistory = () => {
    setMessages([INITIAL_MESSAGE])
    setLastFailedMessage(null)
    sessionStorage.removeItem('sarangtv_chat_history')
  }

  const isInputValid = input.trim().length >= 2 && input.trim().length <= 500 && !loading

  return (
    <>
      {/* Floating Chatbot Panel */}
      {isOpen && (
        <div className="chatbot-panel" role="region" aria-label="SarangTV AI Chatbot">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="chatbot-ai-badge">
                <Sparkles size={14} />
              </span>
              <div>
                <h3>SarangTV AI</h3>
                <span className="chatbot-status-dot">Online</span>
              </div>
            </div>

            <div className="chatbot-header-controls">
              <button
                type="button"
                className="chatbot-control-btn"
                onClick={handleClearHistory}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                className="chatbot-control-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                <ChevronDown size={17} />
              </button>
              <button
                type="button"
                className="chatbot-control-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="chatbot-messages" role="log" aria-live="polite">
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="chatbot-msg-row user">
                    <div className="chatbot-bubble user">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className="chatbot-msg-row ai">
                  <div className="chatbot-ai-avatar">
                    <Bot size={14} />
                  </div>
                  <div className={`chatbot-bubble ai ${msg.isError ? 'error-bubble' : ''}`}>
                    {msg.isError ? (
                      <div className="chatbot-error-content">
                        <p>{msg.text}</p>
                        {msg.isAuthError ? (
                          <button
                            type="button"
                            className="chatbot-retry-btn"
                            onClick={() => navigate('/login')}
                          >
                            Go to Log In
                          </button>
                        ) : msg.originalPrompt ? (
                          <button
                            type="button"
                            className="chatbot-retry-btn"
                            onClick={() => handleRetry(msg.originalPrompt)}
                            disabled={loading}
                          >
                            <RotateCcw size={12} /> Retry
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="chatbot-markdown-body">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="chatbot-msg-row ai">
                <div className="chatbot-ai-avatar">
                  <Bot size={14} />
                </div>
                <div className="chatbot-bubble ai typing-bubble" aria-label="AI is typing...">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (Shown when only greeting exists) */}
          {messages.length <= 1 && !loading && (
            <div className="chatbot-quick-prompts">
              <span className="quick-prompts-label">Try asking:</span>
              <div className="quick-prompts-chips">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chatbot-prompt-chip"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form className="chatbot-input-bar" onSubmit={handleSubmit}>
            <div className="chatbot-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="chatbot-input-field"
                placeholder="Ask about K-Dramas..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                disabled={loading}
              />
              <span className={`chatbot-char-count ${input.length > 480 ? 'warn' : ''}`}>
                {input.length} / 500
              </span>
            </div>

            <button
              type="submit"
              className="chatbot-send-button"
              disabled={!isInputValid}
              aria-label="Send message to AI"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Trigger Button (Bottom-Right) */}
      <button
        type="button"
        className={`chatbot-floating-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close K-Drama AI Chatbot' : 'Open K-Drama AI Chatbot'}
        title="K-Drama AI Assistant"
      >
        {isOpen ? (
          <X size={22} className="trigger-icon" />
        ) : (
          <div className="trigger-icon-wrapper">
            <MessageSquare size={22} className="trigger-icon" />
            <Sparkles size={12} className="trigger-sparkle-badge" />
          </div>
        )}
      </button>
    </>
  )
}

