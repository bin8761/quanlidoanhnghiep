import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

async function createWorkbook() {
  const module = await import('exceljs')
  const ExcelJS = module.default || module
  return new ExcelJS.Workbook()
}

async function normalizeSpreadsheetNamespaces(buffer) {
  const module = await import('jszip')
  const JSZip = module.default || module
  const archive = await JSZip.loadAsync(buffer)
  const spreadsheetNamespace =
    'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
  let changed = false

  await Promise.all(
    Object.keys(archive.files)
      .filter((path) => path.startsWith('xl/') && path.endsWith('.xml'))
      .map(async (path) => {
        const entry = archive.file(path)
        if (!entry) return

        const xml = await entry.async('string')
        if (!xml.includes(`xmlns:x="${spreadsheetNamespace}"`)) return

        archive.file(
          path,
          xml
            .replace(`xmlns:x="${spreadsheetNamespace}"`, `xmlns="${spreadsheetNamespace}"`)
            .replace(/<(\/?)x:/g, '<$1'),
        )
        changed = true
      }),
  )

  return changed ? archive.generateAsync({ type: 'arraybuffer' }) : null
}

async function loadWorkbook(buffer) {
  const workbook = await createWorkbook()

  try {
    await workbook.xlsx.load(buffer)
    return workbook
  } catch (originalError) {
    const normalizedBuffer = await normalizeSpreadsheetNamespaces(buffer)
    if (!normalizedBuffer) throw originalError

    const normalizedWorkbook = await createWorkbook()
    await normalizedWorkbook.xlsx.load(normalizedBuffer)
    return normalizedWorkbook
  }
}

function cellValue(cell) {
  if (cell.value instanceof Date) return cell.value
  if (cell.value && typeof cell.value === 'object') {
    if (typeof cell.value.result !== 'undefined') return cell.value.result
    if (Array.isArray(cell.value.richText)) {
      return cell.value.richText.map((part) => part.text).join('')
    }
    if (typeof cell.text === 'string') return cell.text
  }
  return cell.value ?? ''
}

function addDuplicateErrors(rows, duplicateKeys) {
  const seen = new Map()

  for (const row of rows) {
    for (const { key, label, optional = false } of duplicateKeys) {
      const value = String(row.data[key] ?? '').trim().toLowerCase()
      if (!value && optional) continue
      const cacheKey = `${key}:${value}`
      if (seen.has(cacheKey)) {
        row.errors.push(`${label} bị trùng với dòng ${seen.get(cacheKey)}`)
      } else if (value) {
        seen.set(cacheKey, row.rowNumber)
      }
    }
  }
}

export default function ExcelImportModal({
  title,
  description,
  entityLabel,
  template,
  buildRow,
  lookups,
  duplicateKeys,
  onImport,
  onImported,
  onClose,
}) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [fileError, setFileError] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState(null)

  const validRows = rows.filter((row) => row.errors.length === 0)
  const invalidRows = rows.filter((row) => row.errors.length > 0)

  async function downloadTemplate() {
    const workbook = await createWorkbook()
    const worksheet = workbook.addWorksheet(template.sheetName)
    worksheet.columns = template.columns.map((column) => ({
      key: column.key,
      header: column.header,
      width: column.width,
    }))
    worksheet.addRow(
      Object.fromEntries(template.columns.map((column) => [column.key, column.example])),
    )
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' },
    }
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const url = URL.createObjectURL(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = template.fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function readFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setRows([])
    setResult(null)
    setFileError('')
    setIsReading(true)

    try {
      const workbook = await loadWorkbook(await file.arrayBuffer())
      const worksheet = workbook.worksheets[0]
      if (!worksheet || worksheet.actualRowCount < 2) {
        throw new Error('File Excel không có dòng dữ liệu.')
      }

      const headers = worksheet.getRow(1).values.slice(1).map((value) => String(value || '').trim())
      const parsedRows = []
      worksheet.eachRow((worksheetRow, rowNumber) => {
        if (rowNumber === 1) return
        const raw = {}
        headers.forEach((header, index) => {
          raw[header] = cellValue(worksheetRow.getCell(index + 1))
        })
        const hasValue = Object.values(raw).some((value) => String(value ?? '').trim() !== '')
        if (hasValue) parsedRows.push(buildRow(raw, rowNumber, lookups))
      })

      if (parsedRows.length > 500) {
        throw new Error('Mỗi lần chỉ được nhập tối đa 500 dòng.')
      }
      if (!parsedRows.length) {
        throw new Error('Không tìm thấy dữ liệu hợp lệ trong file.')
      }

      addDuplicateErrors(parsedRows, duplicateKeys)
      setRows(parsedRows)
    } catch (error) {
      setFileError(error.message || 'Không thể đọc file Excel.')
    } finally {
      setIsReading(false)
      event.target.value = ''
    }
  }

  async function submitImport() {
    if (!validRows.length) return
    setIsImporting(true)
    setFileError('')
    try {
      const importResult = await onImport(validRows.map((row) => row.data))
      setResult(importResult)
      await onImported?.(importResult)
    } catch (error) {
      setFileError(error.message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Modal
      size="xl"
      title={title}
      description={description}
      onClose={() => {
        if (!isImporting) onClose()
      }}
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Bắt đầu với file mẫu chuẩn</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Giữ nguyên tên cột để hệ thống đọc dữ liệu chính xác.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={downloadTemplate}>
            <Download size={16} />
            Tải file mẫu
          </Button>
        </div>

        <button
          type="button"
          className="group grid min-h-32 place-items-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
          onClick={() => inputRef.current?.click()}
        >
          <span>
            <span className="mx-auto grid size-11 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
              <Upload size={20} />
            </span>
            <span className="mt-3 block text-sm font-bold text-slate-900">
              {fileName || 'Chọn file Excel để xem trước'}
            </span>
            <span className="mt-1 block text-xs text-slate-500">Hỗ trợ .xlsx, tối đa 500 dòng</span>
          </span>
        </button>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={readFile}
        />

        {fileError ? (
          <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span>{fileError}</span>
          </div>
        ) : null}

        {isReading ? (
          <div className="flex items-center justify-center gap-3 py-8 text-sm font-semibold text-slate-600">
            <FileSpreadsheet className="animate-pulse text-emerald-600" size={20} />
            Đang đọc và kiểm tra dữ liệu...
          </div>
        ) : null}

        {rows.length ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">Tổng số dòng</p>
                <p className="mt-1 text-xl font-extrabold text-slate-900">{rows.length}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs font-semibold text-emerald-700">Sẵn sàng nhập</p>
                <p className="mt-1 text-xl font-extrabold text-emerald-800">{validRows.length}</p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                <p className="text-xs font-semibold text-rose-700">Cần sửa</p>
                <p className="mt-1 text-xl font-extrabold text-rose-800">{invalidRows.length}</p>
              </div>
            </div>

            <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Dòng</th>
                    <th className="px-3 py-2.5">Mã</th>
                    <th className="px-3 py-2.5">Tên</th>
                    <th className="px-3 py-2.5">Thông tin chính</th>
                    <th className="px-3 py-2.5">Phân loại</th>
                    <th className="px-3 py-2.5">Kết quả kiểm tra</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.errors.length ? 'border-t border-rose-100 bg-rose-50/40' : 'border-t border-slate-100'}
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-500">{row.rowNumber}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{row.preview.code}</td>
                      <td className="px-3 py-2.5 text-slate-800">{row.preview.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.preview.reference}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.preview.secondary || '-'}</td>
                      <td className="px-3 py-2.5">
                        {row.errors.length ? (
                          <span className="flex items-start gap-1.5 text-rose-700">
                            <XCircle className="mt-0.5 shrink-0" size={14} />
                            {row.errors.join('; ')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                            <CheckCircle2 size={14} />
                            Hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-bold text-emerald-900">Đã hoàn tất nhập {entityLabel}</p>
            <p className="mt-1 text-sm text-emerald-800">
              Thành công {result.imported}/{result.total} dòng
              {result.failed ? `, ${result.failed} dòng bị backend từ chối.` : '.'}
            </p>
            {result.failed ? (
              <div className="mt-3 grid gap-2 border-t border-emerald-200 pt-3">
                {result.results
                  .filter((item) => !item.success)
                  .map((item) => (
                    <p
                      className="flex items-start gap-2 text-xs font-semibold text-rose-700"
                      key={`${item.rowNumber}-${item.code || 'unknown'}`}
                    >
                      <XCircle className="mt-0.5 shrink-0" size={14} />
                      Dòng {item.rowNumber}: {item.message}
                    </p>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isImporting}>
            Đóng
          </Button>
          <Button
            type="button"
            onClick={submitImport}
            disabled={!validRows.length || isReading || isImporting || Boolean(result)}
          >
            <FileSpreadsheet size={16} />
            {isImporting ? 'Đang nhập dữ liệu...' : `Nhập ${validRows.length} dòng hợp lệ`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
