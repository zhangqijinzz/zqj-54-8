import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Upload, Trash2, Database, AlertTriangle, CheckCircle2, X, FileJson } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { validateImportData, readFileAsJSON, ExportData } from '@/lib/dataManager'

export default function DataManager() {
  const { practiceRecords, weakPoints, exportData, importData, clearRecords } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [pendingImportData, setPendingImportData] = useState<ExportData | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const hasData = practiceRecords.length > 0 || weakPoints.length > 0

  const handleExport = useCallback(() => {
    exportData()
  }, [exportData])

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setImportError(null)
      setImportSuccess(null)
      setIsProcessing(true)

      try {
        const jsonData = await readFileAsJSON(file)
        const validation = validateImportData(jsonData)

        if (!validation.valid) {
          setImportError(validation.error || '文件格式校验失败')
          setIsProcessing(false)
          return
        }

        setPendingImportData(jsonData as ExportData)
      } catch (err) {
        setImportError(err instanceof Error ? err.message : '文件读取失败')
      } finally {
        setIsProcessing(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    []
  )

  const handleConfirmImport = useCallback(
    (mode: 'overwrite' | 'merge') => {
      if (!pendingImportData) return

      const result = importData(pendingImportData, mode)
      setPendingImportData(null)

      const modeText = mode === 'overwrite' ? '覆盖' : '合并'
      setImportSuccess(
        `导入成功（${modeText}模式）：新增 ${result.recordsCount} 条练习记录，${result.weakPointsCount} 条弱点数据`
      )

      setTimeout(() => setImportSuccess(null), 5000)
    },
    [pendingImportData, importData]
  )

  const handleCancelImport = useCallback(() => {
    setPendingImportData(null)
  }, [])

  const handleClearData = useCallback(() => {
    if (clearConfirmText !== '确认清空') return

    clearRecords()
    setShowClearConfirm(false)
    setClearConfirmText('')
  }, [clearConfirmText, clearRecords])

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-white text-2xl font-bold mb-2">数据管理中心</h2>
          <p className="text-white/40 text-sm">管理你的练习数据，支持导出备份和导入恢复</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1]/15 flex items-center justify-center">
                <Database className="w-4 h-4 text-[#6366f1]" />
              </div>
              <span className="text-white/40 text-xs">练习记录</span>
            </div>
            <p className="text-white text-2xl font-bold">{practiceRecords.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#ff6b35]/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#ff6b35]" />
              </div>
              <span className="text-white/40 text-xs">弱点数据</span>
            </div>
            <p className="text-white text-2xl font-bold">{weakPoints.length}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 flex items-center justify-center">
                <Download className="w-5 h-5 text-[#00e676]" />
              </div>
              <div>
                <h3 className="text-white font-bold">导出数据</h3>
                <p className="text-white/40 text-xs">将全部练习数据导出为 JSON 文件</p>
              </div>
            </div>

            <p className="text-white/50 text-sm">
              导出内容包含所有练习记录和弱点数据，可用于备份或迁移到其他设备。
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              disabled={!hasData}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                hasData
                  ? 'bg-[#00e676]/15 text-[#00e676] hover:bg-[#00e676]/25 border border-[#00e676]/20'
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              }`}
            >
              <Download className="w-4 h-4" />
              {hasData ? '导出全部数据' : '暂无数据可导出'}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 flex items-center justify-center">
                <Upload className="w-5 h-5 text-[#6366f1]" />
              </div>
              <div>
                <h3 className="text-white font-bold">导入数据</h3>
                <p className="text-white/40 text-xs">从 JSON 文件恢复练习进度</p>
              </div>
            </div>

            <p className="text-white/50 text-sm">
              选择之前导出的 JSON 文件，系统会校验文件格式和数据完整性。
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-[#6366f1]/15 text-[#6366f1] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#6366f1]/25 border border-[#6366f1]/20 transition-all"
            >
              <Upload className="w-4 h-4" />
              {isProcessing ? '处理中...' : '选择文件导入'}
            </motion.button>

            <AnimatePresence>
              {importError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-[#ff1744]/10 border border-[#ff1744]/20"
                >
                  <AlertTriangle className="w-4 h-4 text-[#ff1744] shrink-0 mt-0.5" />
                  <p className="text-[#ff1744] text-xs">{importError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {importSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-[#00e676]/10 border border-[#00e676]/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00e676] shrink-0 mt-0.5" />
                  <p className="text-[#00e676] text-xs">{importSuccess}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1a1a2e] rounded-2xl border border-[#ff1744]/20 p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff1744]/15 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-[#ff1744]" />
            </div>
            <div>
              <h3 className="text-white font-bold">清空数据</h3>
              <p className="text-white/40 text-xs">永久删除所有练习记录和弱点数据</p>
            </div>
          </div>

          <p className="text-white/50 text-sm">
            此操作不可恢复，请确保已导出重要数据作为备份。
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowClearConfirm(true)}
            disabled={!hasData}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              hasData
                ? 'bg-[#ff1744]/15 text-[#ff1744] hover:bg-[#ff1744]/25 border border-[#ff1744]/20'
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {hasData ? '清空全部数据' : '暂无数据可清空'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {pendingImportData && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={handleCancelImport}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-[#1a1a2e] rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 flex items-center justify-center">
                          <FileJson className="w-5 h-5 text-[#6366f1]" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">确认导入</h3>
                          <p className="text-white/40 text-xs">文件格式校验通过</p>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelImport}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">练习记录</span>
                        <span className="text-white font-medium">
                          {pendingImportData.practiceRecords.length} 条
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">弱点数据</span>
                        <span className="text-white font-medium">
                          {pendingImportData.weakPoints.length} 条
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">导出时间</span>
                        <span className="text-white font-medium">
                          {new Date(pendingImportData.exportedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {hasData ? (
                      <>
                        <p className="text-white/60 text-sm">
                          本地已有数据，请选择导入方式：
                        </p>
                        <div className="space-y-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleConfirmImport('overwrite')}
                            className="w-full py-3 rounded-xl bg-[#ff6b35]/15 text-[#ff6b35] text-sm font-bold border border-[#ff6b35]/20 hover:bg-[#ff6b35]/25 transition-all"
                          >
                            覆盖本地数据
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleConfirmImport('merge')}
                            className="w-full py-3 rounded-xl bg-[#00e676]/15 text-[#00e676] text-sm font-bold border border-[#00e676]/20 hover:bg-[#00e676]/25 transition-all"
                          >
                            合并到本地数据
                          </motion.button>
                        </div>
                        <p className="text-white/30 text-xs text-center">
                          合并模式会保留双方数据，按时间去重
                        </p>
                      </>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleConfirmImport('overwrite')}
                        className="w-full py-3 rounded-xl bg-[#6366f1] text-white text-sm font-bold hover:bg-[#4f46e5] transition-colors"
                      >
                        确认导入
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showClearConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowClearConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-[#1a1a2e] rounded-3xl border border-[#ff1744]/30 w-full max-w-md overflow-hidden shadow-2xl">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#ff1744]/15 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-[#ff1744]" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">确认清空数据？</h3>
                        <p className="text-white/40 text-sm">此操作无法撤销</p>
                      </div>
                    </div>

                    <div className="bg-[#ff1744]/10 rounded-xl p-4 border border-[#ff1744]/20">
                      <p className="text-white/60 text-sm">
                        将永久删除：
                      </p>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-white text-xl font-bold">{practiceRecords.length}</p>
                          <p className="text-white/40 text-xs">练习记录</p>
                        </div>
                        <div>
                          <p className="text-white text-xl font-bold">{weakPoints.length}</p>
                          <p className="text-white/40 text-xs">弱点数据</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-white/60 text-xs block mb-2">
                        请输入 "确认清空" 以继续
                      </label>
                      <input
                        type="text"
                        value={clearConfirmText}
                        onChange={(e) => setClearConfirmText(e.target.value)}
                        placeholder="确认清空"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ff1744]/50 transition-colors"
                      />
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowClearConfirm(false)
                          setClearConfirmText('')
                        }}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        取消
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClearData}
                        disabled={clearConfirmText !== '确认清空'}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                          clearConfirmText === '确认清空'
                            ? 'bg-[#ff1744] text-white hover:bg-[#d50000]'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        确认清空
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
