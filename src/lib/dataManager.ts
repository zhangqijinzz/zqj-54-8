import { PracticeRecord, WeakPoint } from '@/data/types'

export interface ExportData {
  version: string
  exportedAt: string
  practiceRecords: PracticeRecord[]
  weakPoints: WeakPoint[]
}

export interface ValidateResult {
  valid: boolean
  error?: string
}

export interface MergeResult {
  practiceRecords: PracticeRecord[]
  weakPoints: WeakPoint[]
  stats: {
    importedRecords: number
    importedWeakPoints: number
    mergedRecords: number
    mergedWeakPoints: number
  }
}

const EXPORT_VERSION = '1.0.0'

export function exportToJSON(
  practiceRecords: PracticeRecord[],
  weakPoints: WeakPoint[]
): ExportData {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    practiceRecords,
    weakPoints,
  }
}

export function downloadFile(data: ExportData, filename?: string): void {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `interview-practice-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function validateImportData(data: unknown): ValidateResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: '文件格式错误：不是有效的 JSON 对象' }
  }

  const obj = data as Record<string, unknown>

  if (obj.version !== EXPORT_VERSION) {
    return { valid: false, error: `版本不兼容：期望 v${EXPORT_VERSION}，实际 v${obj.version}` }
  }

  if (!Array.isArray(obj.practiceRecords)) {
    return { valid: false, error: '缺少 practiceRecords 数组' }
  }

  if (!Array.isArray(obj.weakPoints)) {
    return { valid: false, error: '缺少 weakPoints 数组' }
  }

  for (let i = 0; i < obj.practiceRecords.length; i++) {
    const record = obj.practiceRecords[i]
    if (typeof record !== 'object' || record === null) {
      return { valid: false, error: `practiceRecords[${i}] 不是有效的对象` }
    }
    const r = record as Record<string, unknown>
    if (typeof r.id !== 'string') return { valid: false, error: `practiceRecords[${i}].id 必须是字符串` }
    if (typeof r.questionId !== 'string') return { valid: false, error: `practiceRecords[${i}].questionId 必须是字符串` }
    if (typeof r.answer !== 'string') return { valid: false, error: `practiceRecords[${i}].answer 必须是字符串` }
    if (typeof r.timeLimit !== 'number') return { valid: false, error: `practiceRecords[${i}].timeLimit 必须是数字` }
    if (typeof r.actualTime !== 'number') return { valid: false, error: `practiceRecords[${i}].actualTime 必须是数字` }
    if (typeof r.isTimeout !== 'boolean') return { valid: false, error: `practiceRecords[${i}].isTimeout 必须是布尔值` }
    if (typeof r.stuckCount !== 'number') return { valid: false, error: `practiceRecords[${i}].stuckCount 必须是数字` }
    if (typeof r.completedAt !== 'string') return { valid: false, error: `practiceRecords[${i}].completedAt 必须是字符串` }
  }

  for (let i = 0; i < obj.weakPoints.length; i++) {
    const wp = obj.weakPoints[i]
    if (typeof wp !== 'object' || wp === null) {
      return { valid: false, error: `weakPoints[${i}] 不是有效的对象` }
    }
    const w = wp as Record<string, unknown>
    if (typeof w.questionId !== 'string') return { valid: false, error: `weakPoints[${i}].questionId 必须是字符串` }
    if (typeof w.stuckCount !== 'number') return { valid: false, error: `weakPoints[${i}].stuckCount 必须是数字` }
    if (typeof w.lastPracticeAt !== 'string') return { valid: false, error: `weakPoints[${i}].lastPracticeAt 必须是字符串` }
    if (typeof w.isMastered !== 'boolean') return { valid: false, error: `weakPoints[${i}].isMastered 必须是布尔值` }
  }

  return { valid: true }
}

export function mergeData(
  localRecords: PracticeRecord[],
  localWeakPoints: WeakPoint[],
  importRecords: PracticeRecord[],
  importWeakPoints: WeakPoint[]
): MergeResult {
  const recordMap = new Map<string, PracticeRecord>()

  localRecords.forEach((r) => recordMap.set(r.id, r))
  const importedRecordsCount = importRecords.length
  const localRecordsCount = localRecords.length

  importRecords.forEach((r) => {
    if (!recordMap.has(r.id)) {
      recordMap.set(r.id, r)
    }
  })

  const mergedRecords = Array.from(recordMap.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  const weakPointMap = new Map<string, WeakPoint>()

  localWeakPoints.forEach((wp) => weakPointMap.set(wp.questionId, wp))
  const importedWeakPointsCount = importWeakPoints.length
  const localWeakPointsCount = localWeakPoints.length

  importWeakPoints.forEach((wp) => {
    const existing = weakPointMap.get(wp.questionId)
    if (existing) {
      weakPointMap.set(wp.questionId, {
        ...existing,
        stuckCount: Math.max(existing.stuckCount, wp.stuckCount),
        lastPracticeAt:
          new Date(existing.lastPracticeAt) > new Date(wp.lastPracticeAt)
            ? existing.lastPracticeAt
            : wp.lastPracticeAt,
        isMastered: existing.isMastered && wp.isMastered,
      })
    } else {
      weakPointMap.set(wp.questionId, wp)
    }
  })

  const mergedWeakPoints = Array.from(weakPointMap.values())

  return {
    practiceRecords: mergedRecords,
    weakPoints: mergedWeakPoints,
    stats: {
      importedRecords: importedRecordsCount,
      importedWeakPoints: importedWeakPointsCount,
      mergedRecords: mergedRecords.length - localRecordsCount,
      mergedWeakPoints: mergedWeakPoints.length - localWeakPointsCount,
    },
  }
}

export async function readFileAsJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        resolve(JSON.parse(content))
      } catch {
        reject(new Error('文件不是有效的 JSON 格式'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
