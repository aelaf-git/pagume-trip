import { useState, useRef, useCallback } from "react"
import { Upload, FileText, CheckCircle2, XCircle, Download } from "lucide-react"
import Modal from "../common/Modal"
import Button from "../common/Button"

const REQUIRED_FIELDS = ["name", "description", "region", "category"]

function validateRow(row, index) {
  const missing = REQUIRED_FIELDS.filter((f) => !row[f] || !String(row[f]).trim())
  if (missing.length > 0) {
    return { valid: false, error: `Row ${index + 1}: missing fields: ${missing.join(", ")}` }
  }
  return { valid: true }
}

function parseCSV(text) {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = values[i] || "" })
    return obj
  })
}

export default function BulkImportModal({ open, onClose, onImport }) {
  const [logs, setLogs] = useState([])
  const [importing, setImporting] = useState(false)
  const [complete, setComplete] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, id: Date.now() + Math.random() }])
  }, [])

  const processFile = useCallback(async (file) => {
    const ext = file.name.split(".").pop().toLowerCase()
    if (ext !== "json" && ext !== "csv") {
      addLog(`Unsupported file format: .${ext}. Please use JSON or CSV.`, "error")
      return
    }

    setImporting(true)
    setLogs([])
    setComplete(false)
    addLog(`Processing ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`)

    const text = await file.text()
    let items

    try {
      if (ext === "json") {
        const parsed = JSON.parse(text)
        items = Array.isArray(parsed) ? parsed : [parsed]
        addLog(`Parsed ${items.length} records from JSON.`)
      } else {
        items = parseCSV(text)
        addLog(`Parsed ${items.length} records from CSV.`)
      }
    } catch {
      addLog(`Failed to parse ${file.name}. Check the file format.`, "error")
      setImporting(false)
      return
    }

    await new Promise((r) => setTimeout(r, 300))

    let valid = 0
    let invalid = 0
    const validItems = []

    for (let i = 0; i < items.length; i++) {
      const result = validateRow(items[i], i)
      if (result.valid) {
        valid++
        validItems.push(items[i])
      } else {
        invalid++
        addLog(result.error, "error")
      }
    }

    await new Promise((r) => setTimeout(r, 200))

    if (valid > 0) {
      addLog(`Validating ${valid} records...`)
      await new Promise((r) => setTimeout(r, 300))
      await onImport(validItems)
      addLog(`Successfully imported ${valid} destinations.`, "success")
    }

    if (invalid > 0) {
      addLog(`${invalid} records skipped due to validation errors.`, "error")
    }

    if (valid === 0) {
      addLog("No valid records to import.", "error")
    }

    setImporting(false)
    setComplete(true)
  }, [addLog, onImport])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }, [processFile])

  const handleExportJSON = () => {
    const sample = [
      { name: "Example Destination", description: "A sample destination.", region: "amhara", category: "historical" },
    ]
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "destination-template.json"
    a.click()
    URL.revokeObjectURL(url)
    addLog("Exported destination-template.json", "success")
  }

  const handleExportCSV = () => {
    const csv = "name,description,region,zone,woreda,latitude,longitude,category,historicalInfo,accessibility,seasonalInfo\nExample Destination,A sample destination.,amhara,,,,39.0,12.0,historical,,,"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "destination-template.csv"
    a.click()
    URL.revokeObjectURL(url)
    addLog("Exported destination-template.csv", "success")
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Import / Export Destinations"
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? "border-brand-500 bg-brand-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Drag and drop a JSON or CSV file here
          </p>
          <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={handleExportJSON}>
            <Download className="h-4 w-4" /> Export JSON Template
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export CSV Template
          </Button>
        </div>

        {logs.length > 0 && (
          <div className="rounded-lg bg-gray-900 p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log) => (
              <div key={log.id} className={`flex items-start gap-2 ${
                log.type === "error" ? "text-red-400" : log.type === "success" ? "text-green-400" : "text-gray-300"
              }`}>
                {log.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                {log.type === "error" && <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                {log.type === "info" && <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                <span>{log.msg}</span>
              </div>
            ))}
            {importing && (
              <div className="flex items-center gap-2 text-brand-400">
                <span className="h-3 w-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <span>Importing...</span>
              </div>
            )}
          </div>
        )}

        {complete && (
          <p className="text-sm text-green-600 font-medium">Import complete.</p>
        )}
      </div>
    </Modal>
  )
}
