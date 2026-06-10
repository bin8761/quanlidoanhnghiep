import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { faqApi } from '../api/faqs'
import { feedbackApi } from '../api/feedbacks'
import { loginHistoryApi } from '../api/loginHistory'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { toast } from 'react-toastify'
import { 
  Settings as SettingsIcon, 
  HelpCircle, 
  MessageSquare, 
  Shield, 
  Sun, 
  Moon, 
  Globe, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Upload,
  History
} from 'lucide-react'

export default function SettingsPage() {
  const { t, locale, setLocale } = useLanguage()
  const { theme, setTheme } = useTheme()
  
  // Tabs: 'general', 'faq', 'feedback', 'security'
  const [activeTab, setActiveTab] = useState('general')
  
  // FAQs State
  const [faqs, setFaqs] = useState([])
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [faqSearch, setFaqSearch] = useState('')

  // Feedback State
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackType, setFeedbackType] = useState('OTHER')
  const [feedbackPriority, setFeedbackPriority] = useState('MEDIUM')
  const [feedbackFile, setFeedbackFile] = useState(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Login History State
  const [loginHistory, setLoginHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (activeTab === 'faq') {
      fetchFaqs()
    } else if (activeTab === 'feedback') {
      fetchFeedbackHistory()
    } else if (activeTab === 'security') {
      fetchLoginHistory()
    }
  }, [activeTab])

  const fetchFaqs = async () => {
    try {
      const data = await faqApi.list()
      setFaqs(data)
    } catch (error) {
      toast.error('Không thể tải danh sách câu hỏi')
    }
  }

  const fetchFeedbackHistory = async () => {
    try {
      const data = await feedbackApi.getMyHistory()
      setFeedbacks(data)
    } catch (error) {
      toast.error('Không thể tải lịch sử góp ý')
    }
  }

  const fetchLoginHistory = async () => {
    try {
      setLoadingHistory(true)
      const data = await loginHistoryApi.getMyHistory({ page: 1, pageSize: 20 })
      setLoginHistory(data.items || [])
    } catch (error) {
      toast.error('Không thể tải lịch sử đăng nhập')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!feedbackTitle.trim() || !feedbackContent.trim()) {
      toast.warning('Vui lòng điền đầy đủ tiêu đề và nội dung.')
      return
    }

    try {
      setSubmittingFeedback(true)
      const formData = new FormData()
      formData.append('title', feedbackTitle)
      formData.append('content', feedbackContent)
      formData.append('category', feedbackType)
      formData.append('priority', feedbackPriority)
      if (feedbackFile) {
        formData.append('file', feedbackFile)
      }

      await feedbackApi.create(formData)
      toast.success(t('feedbackSuccess'))
      setFeedbackTitle('')
      setFeedbackContent('')
      setFeedbackFile(null)
      fetchFeedbackHistory()
    } catch (error) {
      toast.error(error.message || 'Gửi góp ý thất bại!')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Filter FAQs based on query
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  )

  return (
    <div className="animate-fade-up max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Tùy chỉnh hệ thống & hỗ trợ"
        title={t('settings')}
        description="Quản lý giao diện, ngôn ngữ, xem câu hỏi thường gặp hoặc gửi phản hồi góp ý."
        icon={SettingsIcon}
      />

      <div className="mt-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="surface p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {[
              { id: 'general', label: t('general'), icon: Globe },
              { id: 'faq', label: t('faq'), icon: HelpCircle },
              { id: 'feedback', label: t('feedback'), icon: MessageSquare },
              { id: 'security', label: t('security'), icon: Shield },
            ].map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive 
                      ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-emerald-300' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <div className="surface p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
                {t('general')}
              </h3>

              {/* Theme Settings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('theme')}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Thay đổi giao diện sáng tối phù hợp với bạn.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      theme === 'light'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sun size={15} />
                    {t('lightMode')}
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      theme === 'dark'
                        ? 'border-brand-500 bg-brand-900/30 text-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Moon size={15} />
                    {t('darkMode')}
                  </button>
                </div>
              </div>

              {/* Language Settings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('language')}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Chuyển đổi ngôn ngữ hiển thị trên toàn bộ trang web.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocale('vi')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      locale === 'vi'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => setLocale('en')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      locale === 'en'
                        ? 'border-brand-500 bg-brand-900/30 text-emerald-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="surface p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t('faq')}
                </h3>
                <input
                  type="text"
                  placeholder={t('searchFaq')}
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>

              {/* Accordion List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => {
                    const isExpanded = expandedFaq === index
                    return (
                      <div key={faq.id} className="py-4 first:pt-0 last:pb-0">
                        <button
                          onClick={() => setExpandedFaq(isExpanded ? null : index)}
                          className="w-full flex items-center justify-between text-left focus:outline-none"
                        >
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 transition">
                            [{faq.category}] {faq.question}
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 pl-2 border-l-2 border-brand-500">
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">Không tìm thấy câu hỏi phù hợp.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {/* Submission Form */}
              <div className="surface p-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  {t('newFeedback')}
                </h3>

                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <FormField label={t('title')} required>
                    <input
                      type="text"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                      placeholder="VD: Giao diện tối hiển thị lỗi ở màn hình báo cáo"
                      className="form-input text-xs"
                      required
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={t('type')}>
                      <select
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        className="form-input text-xs"
                      >
                        <option value="BUG">{t('typeBug')}</option>
                        <option value="FEATURE">{t('typeFeature')}</option>
                        <option value="UI_UX">{t('typeUI')}</option>
                        <option value="OTHER">{t('typeOther')}</option>
                      </select>
                    </FormField>

                    <FormField label={t('priority')}>
                      <select
                        value={feedbackPriority}
                        onChange={(e) => setFeedbackPriority(e.target.value)}
                        className="form-input text-xs"
                      >
                        <option value="LOW">{t('priorityLow')}</option>
                        <option value="MEDIUM">{t('priorityMedium')}</option>
                        <option value="HIGH">{t('priorityHigh')}</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField label={t('content')} required>
                    <textarea
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="Mô tả chi tiết góp ý hoặc phản hồi của bạn..."
                      rows={4}
                      className="form-input text-xs resize-y"
                      required
                    />
                  </FormField>

                  <FormField label={t('attachment')}>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Upload size={14} />
                        Chọn file đính kèm
                        <input
                          type="file"
                          onChange={(e) => setFeedbackFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-slate-400 truncate max-w-xs">
                        {feedbackFile ? feedbackFile.name : 'Chưa chọn file nào'}
                      </span>
                    </div>
                  </FormField>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={submittingFeedback}>
                      {submittingFeedback ? t('loading') : t('submit')}
                    </Button>
                  </div>
                </form>
              </div>

              {/* History Portal */}
              <div className="surface p-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  {t('feedbackHistory')}
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((fb) => (
                      <div key={fb.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {fb.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                              {fb.content}
                            </p>
                            <div className="flex flex-wrap gap-2 items-center mt-2 text-[10px] text-slate-400 font-semibold">
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                {fb.category === 'UI_UX' ? t('typeUI') : t(`type${fb.category.charAt(0) + fb.category.slice(1).toLowerCase()}`)}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded ${
                                fb.priority === 'HIGH' ? 'bg-red-50 text-red-700' : fb.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {t(`priority${fb.priority.charAt(0) + fb.priority.slice(1).toLowerCase()}`)}
                              </span>
                              {fb.filePath && (
                                <a
                                  href={`http://localhost:5000/uploads/${fb.filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-brand-600 hover:underline"
                                >
                                  <FileText size={12} /> File đính kèm
                                </a>
                              )}
                              <span>• {new Date(fb.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fb.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : fb.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700' : fb.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {t(`status${fb.status.charAt(0) + fb.status.slice(1).toLowerCase()}`)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-6">Bạn chưa gửi góp ý nào.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="surface p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
                {t('loginHistory')}
              </h3>

              {loadingHistory ? (
                <div className="space-y-3">
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-3">{t('time')}</th>
                        <th className="pb-3">{t('ipAddress')}</th>
                        <th className="pb-3">{t('browser')}</th>
                        <th className="pb-3">{t('os')}</th>
                        <th className="pb-3">{t('device')}</th>
                        <th className="pb-3">{t('loginStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      {loginHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3.5 whitespace-nowrap">{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                          <td className="py-3.5">{item.ipAddress}</td>
                          <td className="py-3.5">{item.browser}</td>
                          <td className="py-3.5">{item.os}</td>
                          <td className="py-3.5">{item.device}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {item.status === 'SUCCESS' ? t('loginSuccess') : t('loginFailed')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!loginHistory.length && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            Không có lịch sử đăng nhập nào được ghi lại.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
