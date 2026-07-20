import { useState } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { useTheme } from '../hooks/useTheme'
import { faqApi } from '../api/faqs'
import { feedbackApi, getFeedbackFileName, getFeedbackFileUrl } from '../api/feedbacks'
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
  Check
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

  const fetchFaqs = async () => {
    try {
      const data = await faqApi.list()
      setFaqs(data)
    } catch {
      toast.error('Không thể tải danh sách câu hỏi')
    }
  }

  const fetchFeedbackHistory = async () => {
    try {
      const data = await feedbackApi.getMyHistory()
      setFeedbacks(data)
    } catch {
      toast.error('Không thể tải lịch sử góp ý')
    }
  }

  const fetchLoginHistory = async () => {
    try {
      setLoadingHistory(true)
      const data = await loginHistoryApi.getMyHistory({ page: 1, pageSize: 20 })
      setLoginHistory(data.items || [])
    } catch {
      toast.error('Không thể tải lịch sử đăng nhập')
    } finally {
      setLoadingHistory(false)
    }
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId)
    if (tabId === 'faq') {
      fetchFaqs()
    } else if (tabId === 'feedback') {
      fetchFeedbackHistory()
    } else if (tabId === 'security') {
      fetchLoginHistory()
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
  const filteredFaqs = faqs.filter(faq => {
    const query = faqSearch.toLowerCase()
    const searchableText = [
      faq.question,
      faq.answer,
      faq.category,
      locale === 'en' ? t(faq.question) : '',
      locale === 'en' ? t(faq.answer) : '',
      locale === 'en' ? t(faq.category) : '',
    ].join(' ').toLowerCase()

    return searchableText.includes(query)
  })

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        eyebrow={t('Tùy chỉnh hệ thống & hỗ trợ')}
        title={t('settings')}
        description={t('Quản lý giao diện, ngôn ngữ, xem câu hỏi thường gặp hoặc gửi phản hồi góp ý.')}
        icon={SettingsIcon}
      />

      <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="surface flex flex-row gap-1 overflow-x-auto p-2 md:flex-col md:overflow-x-visible">
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
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex min-h-11 items-center gap-3 rounded-[10px] px-4 text-xs font-bold whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
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
            <div className="surface overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-700/70 sm:px-6">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {t('general')}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {t('Cá nhân hóa cách không gian làm việc hiển thị trên thiết bị của bạn.')}
                </p>
              </div>

              {/* Theme Settings */}
              <div className="grid gap-6 p-5 sm:p-6">
                <section>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('theme')}</h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('Chọn độ sáng phù hợp với môi trường làm việc.')}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        value: 'light',
                        label: t('lightMode'),
                        description: t('Sáng rõ, phù hợp ban ngày'),
                        icon: Sun,
                        previewClass: 'bg-[#f4f7f6]',
                      },
                      {
                        value: 'dark',
                        label: t('darkMode'),
                        description: t('Dịu mắt trong môi trường tối'),
                        icon: Moon,
                        previewClass: 'bg-[#0d1512]',
                      },
                    ].map((option) => {
                      const Icon = option.icon
                      const selected = theme === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setTheme(option.value)}
                          className={`group relative overflow-hidden rounded-[14px] border p-4 text-left transition-all focus-visible:ring-4 focus-visible:ring-brand-500/15 ${
                            selected
                              ? 'border-brand-500 bg-brand-50/60 shadow-sm dark:border-emerald-400/70 dark:bg-emerald-400/8'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-white/[0.025] dark:hover:border-slate-600 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className={`mb-4 block h-16 overflow-hidden rounded-[10px] border border-slate-200/80 ${option.previewClass} dark:border-white/10`}>
                            <span className="flex h-4 items-center gap-1 border-b border-black/5 bg-white/80 px-2 dark:border-white/5 dark:bg-white/10">
                              <span className="size-1.5 rounded-full bg-rose-400" />
                              <span className="size-1.5 rounded-full bg-amber-400" />
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                            </span>
                            <span className="grid grid-cols-[22px_1fr] gap-2 p-2">
                              <span className="h-8 rounded bg-emerald-900/90" />
                              <span className="grid gap-1">
                                <span className="h-2 rounded bg-slate-400/35" />
                                <span className="h-5 rounded bg-white shadow-sm dark:bg-white/12" />
                              </span>
                            </span>
                          </span>
                          <span className="flex items-start gap-3">
                            <span className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
                              selected
                                ? 'bg-brand-700 text-white dark:bg-emerald-400 dark:text-emerald-950'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              <Icon size={17} />
                            </span>
                            <span className="min-w-0">
                              <strong className="block text-sm text-slate-900 dark:text-slate-100">{option.label}</strong>
                              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
                            </span>
                            {selected ? (
                              <span className="ml-auto grid size-6 shrink-0 place-items-center rounded-full bg-brand-700 text-white dark:bg-emerald-400 dark:text-emerald-950">
                                <Check size={14} strokeWidth={3} />
                              </span>
                            ) : null}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="border-t border-slate-100 pt-5 dark:border-slate-700/70">
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('language')}</h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('Ngôn ngữ được lưu riêng trên trình duyệt này.')}</p>
                  </div>
                  <div className="inline-flex w-full rounded-[12px] border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900/60 sm:w-auto">
                    {[
                      { value: 'vi', label: 'Tiếng Việt' },
                      { value: 'en', label: 'English' },
                    ].map((option) => {
                      const selected = locale === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setLocale(option.value)}
                          className={`flex min-h-9 flex-1 items-center justify-center gap-2 rounded-[9px] px-5 text-xs font-bold transition sm:flex-none ${
                            selected
                              ? 'bg-white text-brand-800 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                          }`}
                        >
                          {selected ? <Check size={13} strokeWidth={3} /> : null}
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </section>
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
                  className="rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-slate-900/70"
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
                            [{t(faq.category)}] {t(faq.question)}
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 pl-2 border-l-2 border-brand-500">
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                              {t(faq.answer)}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">{t('Không tìm thấy câu hỏi phù hợp.')}</p>
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
                              {fb.fileUrl && (
                                <a
                                  href={getFeedbackFileUrl(fb.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex min-w-0 items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
                                  title={getFeedbackFileName(fb.fileUrl)}
                                >
                                  <FileText className="shrink-0" size={12} />
                                  <span className="max-w-40 truncate">{getFeedbackFileName(fb.fileUrl)}</span>
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
