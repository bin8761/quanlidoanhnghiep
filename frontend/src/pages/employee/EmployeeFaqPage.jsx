import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, Search, ChevronDown, ChevronUp, Send, BookOpen, Layers, Laptop, Network, KeyRound, Wrench } from 'lucide-react'
import { faqApi } from '../../api/faqs'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'

const CATEGORY_ICONS = {
  'Tài sản': Laptop,
  'Đăng nhập': KeyRound,
  'Nhân viên': BookOpen,
  'Bảo mật': KeyRound,
  'Khác': HelpCircle,
  'Mạng': Network,
  'Hệ thống': Layers,
}

export default function EmployeeFaqPage() {
  const [faqs, setFaqs] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaqId, setExpandedFaqId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadData() {
      setIsLoading(true)
      setError('')
      try {
        const [faqList, catList] = await Promise.all([
          faqApi.list(),
          faqApi.getCategories()
        ])
        if (active) {
          setFaqs(faqList)
          setCategories(catList)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Không thể tải dữ liệu hướng dẫn.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = !selectedCategory || faq.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const matchesText = 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query)
      return matchesCategory && matchesText
    })
  }, [faqs, selectedCategory, searchQuery])

  if (isLoading) {
    return <div className="grid min-h-72 place-items-center">Đang tải tài liệu hướng dẫn...</div>
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Tự phục vụ & Hướng dẫn"
        title="Cẩm nang tự phục vụ"
        description="Tra cứu hướng dẫn sử dụng thiết bị, phần mềm và quy trình làm việc tại doanh nghiệp."
        icon={BookOpen}
        actions={
          <Link to="/employee/requests">
            <Button variant="secondary">
              <Send size={15} /> Gửi yêu cầu hỗ trợ
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search Bar & Stats */}
      <div className="surface p-4 border-slate-100 flex flex-col sm:flex-row items-center gap-4 dark:border-slate-800">
        <div className="relative w-full flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi, hướng dẫn, phần mềm, thiết bị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:ring-emerald-600"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 shrink-0">
          Hiển thị: <span className="text-slate-800 dark:text-slate-200 font-bold">{filteredFaqs.length}</span> hướng dẫn
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
            !selectedCategory
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={14} />
          Tất cả danh mục
        </button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || HelpCircle
          const isSelected = selectedCategory === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                isSelected
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              {cat}
            </button>
          )
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isExpanded = expandedFaqId === faq.id
          const CategoryIcon = CATEGORY_ICONS[faq.category] || HelpCircle

          return (
            <article
              key={faq.id}
              className={`surface border border-slate-100 hover:border-slate-200/60 dark:border-slate-800/80 dark:hover:border-slate-700/60 transition-all duration-200 overflow-hidden ${
                isExpanded ? 'ring-1 ring-emerald-500/10 shadow-soft' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 shrink-0">
                    <CategoryIcon size={15} />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                      {faq.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {faq.question}
                    </h3>
                  </div>
                </div>
                <span className="text-slate-400 shrink-0 ml-4">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-50 dark:border-slate-800/50 animate-fade-down">
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/80">
                    {faq.answer}
                  </div>
                </div>
              )}
            </article>
          )
        })}

        {!filteredFaqs.length && (
          <div className="surface py-12 text-center border-slate-100 dark:border-slate-800">
            <HelpCircle size={36} className="mx-auto text-slate-300" />
            <p className="mt-3 text-xs text-slate-500">
              Không tìm thấy hướng dẫn nào khớp với từ khóa tìm kiếm của bạn.
            </p>
            <Link to="/employee/requests" className="mt-4 inline-block">
              <Button size="sm">
                <Wrench size={14} /> Gửi yêu cầu cho IT
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Support Card CTA */}
      <section className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide">Bạn vẫn cần trợ giúp?</h3>
          <p className="mt-1 text-xs text-emerald-100">
            Nếu cẩm nang không giải quyết được vấn đề của bạn, hãy tạo phiếu hỗ trợ để kỹ thuật viên IT của chúng tôi hỗ trợ ngay.
          </p>
        </div>
        <Link to="/employee/requests" className="shrink-0">
          <Button className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-md">
            Tạo phiếu hỗ trợ
          </Button>
        </Link>
      </section>
    </div>
  )
}
