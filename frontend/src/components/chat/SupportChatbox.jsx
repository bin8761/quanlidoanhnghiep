import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Bot, Headset, Sparkles, AlertCircle } from 'lucide-react'
import { supportChatApi } from '../../api/supportChat'

// Simple helper to parse basic markdown (**bold**, \n, and lists)
function renderMarkdown(text) {
  if (!text) return ''

  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Code: `code`
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>')

  // Line breaks: \n
  html = html.replace(/\n/g, '<br />')

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function SupportChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionStatus, setSessionStatus] = useState('BOT') // BOT, ACTIVE, CLOSED
  const [error, setError] = useState(null)
  
  const messagesEndRef = useRef(null)
  const pollingInterval = useRef(null)

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      // Start polling for new messages every 3 seconds
      pollingInterval.current = setInterval(loadMessages, 3000)
    } else {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const loadMessages = async () => {
    try {
      const response = await supportChatApi.getMessages()
      if (response && Array.isArray(response)) {
        setMessages(response)
        
        // Detect session status from last message or session (backend defaults to BOT/ACTIVE)
        // If there are messages, we can check if last message contains closed system text or just keep polling
        const hasHandover = response.some(m => m.message.includes('Đã kết nối trực tiếp với Hỗ trợ viên'))
        const isClosed = response.some(m => m.message.includes('Phiên hỗ trợ này đã được hỗ trợ viên đóng lại'))
        
        if (isClosed) {
          setSessionStatus('CLOSED')
        } else if (hasHandover) {
          setSessionStatus('ACTIVE')
        } else {
          setSessionStatus('BOT')
        }
      }
      setError(null)
    } catch (err) {
      console.error('Failed to load chat messages:', err)
      setError('Không thể kết nối đến máy chủ.')
    }
  }

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue
    if (!text.trim()) return

    if (!textToSend) {
      setInputValue('')
    }
    setError(null)

    // Optimistically add user message to list
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      senderType: 'USER',
      message: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    
    // Show typing indicator if in BOT mode
    if (sessionStatus === 'BOT') {
      setIsTyping(true)
    }

    try {
      const response = await supportChatApi.sendMessage(text)
      if (response && Array.isArray(response)) {
        setMessages(response)
        
        // Re-check status
        const hasHandover = response.some(m => m.message.includes('Đã kết nối trực tiếp với Hỗ trợ viên'))
        if (hasHandover) {
          setSessionStatus('ACTIVE')
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Gửi tin nhắn thất bại. Vui lòng thử lại.')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (keyword) => {
    handleSend(keyword)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      <button
        onClick={handleToggle}
        className={`flex size-14 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-rose-500 hover:bg-rose-600 rotate-90'
            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:shadow-emerald-500/30'
        }`}
        title="Trợ giúp trực tuyến"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 flex h-[520px] w-92 animate-in slide-in-from-bottom-6 fade-in duration-300 flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="relative rounded-lg bg-white/10 p-1.5">
                {sessionStatus === 'BOT' ? (
                  <Sparkles size={18} className="text-emerald-200" />
                ) : (
                  <Headset size={18} className="text-teal-200" />
                )}
                <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  {sessionStatus === 'BOT' ? 'Trợ lý ảo EAM' : 'Hỗ trợ trực tuyến'}
                </h3>
                <span className="text-[10px] text-emerald-100">
                  {sessionStatus === 'BOT' ? 'Trí tuệ nhân tạo' : 'Hỗ trợ viên đang online'}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="rounded-lg p-1 text-emerald-100 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                <div className="rounded-full bg-emerald-50 p-3 text-emerald-500 mb-2">
                  <Bot size={28} />
                </div>
                <p className="text-xs font-semibold text-slate-600">Xin chào!</p>
                <p className="mt-1 text-[11px]">
                  Tôi là Trợ lý ảo EAM. Hãy hỏi tôi về tài sản đang dùng hoặc yêu cầu bảo trì.
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.senderType === 'USER'
              const isBot = msg.senderType === 'BOT'
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className={`mt-0.5 rounded-lg p-1.5 ${isBot ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {isBot ? <Bot size={15} /> : <Headset size={15} />}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm transition-all duration-200 ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : isBot
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        : 'bg-blue-50 border border-blue-100 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {renderMarkdown(msg.message)}
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="mt-0.5 rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                  <Bot size={15} />
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm rounded-tl-none">
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400" />
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400 delay-100" />
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400 delay-200" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-[11px] text-rose-600 border border-rose-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {sessionStatus === 'BOT' && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSuggestionClick('Tài sản của tôi')}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  📋 Tài sản
                </button>
                <button
                  onClick={() => handleSuggestionClick('Yêu cầu hỗ trợ')}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  🛠️ Phiếu yêu cầu
                </button>
                <button
                  onClick={() => handleSuggestionClick('Gặp hỗ trợ viên')}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  📞 Gặp Admin
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-emerald-500/10">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Nhập câu hỏi tại đây..."
                disabled={sessionStatus === 'CLOSED'}
                className="flex-1 resize-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || sessionStatus === 'CLOSED'}
                className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Send size={15} />
              </button>
            </div>
            {sessionStatus === 'CLOSED' && (
              <p className="mt-1 text-center text-[10px] text-slate-400 font-medium">
                Phiên hội thoại đã đóng. Vui lòng mở lại sau.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
