import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Send,
  User,
  Building,
  MapPin,
  Wrench,
  Boxes,
  HelpCircle,
  Power,
  MessageSquare,
  AlertCircle,
  Calendar,
  Bot,
} from 'lucide-react'
import { supportChatApi } from '../../api/supportChat'

function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
  html = html.replace(/\n/g, '<br />')
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function SupportChatPage() {
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [sessionDetail, setSessionDetail] = useState(null) // { session, messages, employeeContext }
  const [replyText, setReplyText] = useState('')
  const [keyword, setKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL') // ALL, ACTIVE, BOT
  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)
  const listPolling = useRef(null)
  const detailPolling = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Poll active sessions list
  useEffect(() => {
    loadSessions()
    listPolling.current = setInterval(loadSessions, 10000) // Poll list every 10s

    return () => {
      if (listPolling.current) clearInterval(listPolling.current)
    }
  }, [])

  // Poll selected session details
  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetails(selectedSessionId)
      
      if (detailPolling.current) clearInterval(detailPolling.current)
      detailPolling.current = setInterval(() => loadSessionDetails(selectedSessionId), 3000) // Poll details every 3s
    } else {
      setSessionDetail(null)
      if (detailPolling.current) {
        clearInterval(detailPolling.current)
        detailPolling.current = null
      }
    }

    return () => {
      if (detailPolling.current) clearInterval(detailPolling.current)
    }
  }, [selectedSessionId])

  useEffect(() => {
    scrollToBottom()
  }, [sessionDetail?.messages])

  const loadSessions = async () => {
    try {
      const response = await supportChatApi.adminListSessions()
      if (response && Array.isArray(response)) {
        setSessions(response)
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err)
      setError('Không thể tải danh sách phiên chat.')
    }
  }

  const loadSessionDetails = async (sessionId) => {
    try {
      const response = await supportChatApi.adminGetSessionDetails(sessionId)
      if (response) {
        setSessionDetail(response)
      }
    } catch (err) {
      console.error('Failed to load session details:', err)
      setError('Không thể tải lịch sử cuộc trò chuyện.')
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedSessionId) return
    const text = replyText
    setReplyText('')
    setError(null)

    // Optimistic message update
    const tempAdminMsg = {
      id: `temp-${Date.now()}`,
      senderType: 'ADMIN',
      message: text,
      createdAt: new Date().toISOString(),
    }
    setSessionDetail((prev) => {
      if (!prev) return null
      return {
        ...prev,
        messages: [...prev.messages, tempAdminMsg],
      }
    })

    try {
      const response = await supportChatApi.adminSendMessage(selectedSessionId, text)
      if (response && Array.isArray(response)) {
        setSessionDetail((prev) => {
          if (!prev) return null
          return {
            ...prev,
            messages: response,
          }
        })
        loadSessions() // Refresh snippet in sidebar
      }
    } catch (err) {
      console.error('Failed to send reply:', err)
      setError('Không thể gửi tin nhắn phản hồi.')
    }
  }

  const handleCloseSession = async () => {
    if (!selectedSessionId) return
    if (!window.confirm('Bạn có chắc chắn muốn đóng phiên hỗ trợ này không?')) return
    setError(null)

    try {
      await supportChatApi.adminCloseSession(selectedSessionId)
      setSelectedSessionId(null)
      setSessionDetail(null)
      loadSessions()
    } catch (err) {
      console.error('Failed to close session:', err)
      setError('Không thể đóng phiên hỗ trợ.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  // Filtering
  const filteredSessions = sessions.filter((s) => {
    const fullName = s.employee?.fullName?.toLowerCase() || ''
    const email = s.employee?.email?.toLowerCase() || ''
    const matchesKeyword = fullName.includes(keyword.toLowerCase()) || email.includes(keyword.toLowerCase())
    
    if (filterStatus === 'ALL') return matchesKeyword
    return s.status === filterStatus && matchesKeyword
  })

  const empContext = sessionDetail?.employeeContext

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[500px] w-full gap-4 overflow-hidden p-1 font-sans">
      {/* 1. Sidebar Sessions List */}
      <div className="flex w-80 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-brand-500" />
            Hỗ trợ trực tuyến
          </h2>
          <div className="relative mb-3">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs outline-none transition focus:border-brand-500 focus:bg-white"
            />
          </div>
          {/* Filter Status Pills */}
          <div className="flex gap-1.5">
            {['ALL', 'ACTIVE', 'BOT'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all duration-200 ${
                  filterStatus === status
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? 'Tất cả' : status === 'ACTIVE' ? 'Admin Live' : 'AI Bot'}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Không tìm thấy phiên chat nào.
            </div>
          ) : (
            filteredSessions.map((s) => {
              const lastMsg = s.messages?.[0]
              const isSelected = selectedSessionId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`w-full flex flex-col text-left rounded-xl p-3 transition-all duration-200 ${
                    isSelected
                      ? 'bg-brand-50 border border-brand-100 text-brand-900'
                      : 'border border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold truncate pr-2">
                      {s.employee?.fullName}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        s.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {s.status === 'ACTIVE' ? 'LIVE' : 'BOT'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mb-1">
                    {s.employee?.department?.name || 'Không rõ phòng ban'}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate w-full">
                    {lastMsg ? lastMsg.message : 'Chưa có tin nhắn...'}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Console */}
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {selectedSessionId && sessionDetail ? (
          <>
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User size={15} className="text-slate-500" />
                  {sessionDetail.session?.employee?.fullName}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {sessionDetail.session?.employee?.email}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    sessionDetail.session?.status === 'ACTIVE'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${sessionDetail.session?.status === 'ACTIVE' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
                  Chế độ: {sessionDetail.session?.status === 'ACTIVE' ? 'Hỗ trợ viên trực tuyến' : 'AI Trợ lý ảo'}
                </span>
                <button
                  onClick={handleCloseSession}
                  className="flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-200"
                  title="Kết thúc phiên hỗ trợ"
                >
                  <Power size={13} />
                  Đóng phiên
                </button>
              </div>
            </div>

            {/* Console Messages Box */}
            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6 space-y-4">
              {sessionDetail.messages.map((msg) => {
                const isUser = msg.senderType === 'USER'
                const isBot = msg.senderType === 'BOT'
                const isAdmin = msg.senderType === 'ADMIN'

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isAdmin && (
                      <div className={`mt-0.5 rounded-lg p-1.5 ${isBot ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isBot ? <Bot size={15} /> : <User size={15} />}
                      </div>
                    )}
                    <div className="flex flex-col max-w-[70%]">
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs shadow-sm transition-all duration-200 ${
                          isAdmin
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : isBot
                            ? 'bg-emerald-50 border border-emerald-100 text-slate-800 rounded-tl-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {renderMarkdown(msg.message)}
                      </div>
                      <span className={`text-[9px] text-slate-400 mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Console Footer Input */}
            <div className="border-t border-slate-100 p-4">
              {error && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-600 border border-rose-100">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-brand-500/10">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Nhập nội dung trả lời nhân viên (Nhấn Enter để gửi)..."
                  className="flex-1 resize-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="rounded-xl bg-brand-600 p-2.5 text-white hover:bg-brand-700 transition disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-slate-400">
            <div className="rounded-full bg-slate-50 p-4 mb-3">
              <MessageSquare size={32} className="text-slate-300 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-600">Chọn cuộc trò chuyện</h3>
            <p className="mt-1 text-xs max-w-xs leading-relaxed">
              Chọn một nhân sự từ danh sách hàng đợi bên trái để bắt đầu tiếp nhận hỗ trợ trực tiếp.
            </p>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar - Context Panel */}
      {selectedSessionId && empContext && (
        <div className="w-72 shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-y-auto p-4 space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Hồ sơ nhân sự
            </h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Building size={14} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500">Phòng ban:</span>
                <span className="font-bold truncate">{empContext.department?.name || 'Chưa phân bổ'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500">Chức vụ:</span>
                <span className="font-bold truncate">{empContext.position || 'Nhân viên'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500">Vị trí:</span>
                <span className="font-bold truncate">{empContext.location?.name || 'Không có'}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Assigned Assets */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Tài sản bàn giao</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                {empContext.assignments?.length || 0}
              </span>
            </h3>
            <div className="space-y-2">
              {!empContext.assignments || empContext.assignments.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Không có tài sản nào đang giữ.</p>
              ) : (
                empContext.assignments.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
                    <div className="font-bold text-slate-800 mb-0.5 truncate">{a.asset.name}</div>
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Mã: <code className="bg-slate-200 px-0.5 py-0.2 rounded font-mono">{a.asset.assetCode}</code></span>
                      <span className="font-semibold capitalize text-brand-700 bg-white border border-brand-100 px-1 rounded">{a.asset.status.toLowerCase()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Recent Support Requests */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Yêu cầu hỗ trợ</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                {empContext.supportRequests?.length || 0}
              </span>
            </h3>
            <div className="space-y-2">
              {!empContext.supportRequests || empContext.supportRequests.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Không có yêu cầu bảo trì gần đây.</p>
              ) : (
                empContext.supportRequests.map((r) => (
                  <div key={r.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
                      <span>Phiếu #{r.id.slice(0, 5)}</span>
                      <span className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold ${
                        r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>{r.status}</span>
                    </div>
                    <div className="text-slate-500 line-clamp-2">{r.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
