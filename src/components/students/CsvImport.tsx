import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useStudentStore } from '@/stores/studentStore'
import { GRADE_LABELS } from '@/lib/constants'
import type { GradeLevel } from '@/types'
import { toast } from 'sonner'

interface CsvImportProps {
  open: boolean
  onClose: () => void
}

interface ParsedRow {
  name: string
  grade_level: GradeLevel
  memo: string
  valid: boolean
  error?: string
}

const GRADE_MAP: Record<string, GradeLevel> = {
  초등: 'elementary',
  중등: 'middle',
  고등: 'high',
  elementary: 'elementary',
  middle: 'middle',
  high: 'high',
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split('\n').filter((l) => l.trim())
  const rows: ParsedRow[] = []

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim())
    const name = parts[0] || ''
    const gradeRaw = parts[1] || ''
    const memo = parts[2] || ''

    if (!name) {
      // skip header row if it contains "이름"
      if (i === 0 && gradeRaw.includes('학년')) continue
      rows.push({ name, grade_level: 'middle', memo, valid: false, error: '이름 없음' })
      continue
    }

    const grade = GRADE_MAP[gradeRaw]
    if (!grade) {
      rows.push({
        name,
        grade_level: 'middle',
        memo,
        valid: false,
        error: `학년 오류: "${gradeRaw}" (초등/중등/고등)`,
      })
      continue
    }

    rows.push({ name, grade_level: grade, memo, valid: true })
  }

  return rows
}

export default function CsvImport({ open, onClose }: CsvImportProps) {
  const { addStudent } = useStudentStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCsv(text))
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) {
      toast.error('가져올 수 있는 학생이 없습니다')
      return
    }

    setIsImporting(true)
    let success = 0
    let failed = 0

    for (const row of validRows) {
      try {
        await addStudent(
          { name: row.name, grade_level: row.grade_level, parent_phone: null, memo: row.memo || null },
          []
        )
        success++
      } catch {
        failed++
      }
    }

    toast.success(`${success}명 등록 완료${failed > 0 ? `, ${failed}명 실패` : ''}`)
    setRows([])
    if (fileRef.current) fileRef.current.value = ''
    onClose()
    setIsImporting(false)
  }

  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.filter((r) => !r.valid).length

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[70dvh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>CSV 가져오기</SheetTitle>
          <SheetDescription>CSV 형식: 이름,학년(초등/중등/고등),메모</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* File input */}
          <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">CSV 파일을 선택하세요</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="block mx-auto text-sm"
            />
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-emerald-600 font-medium">가져올 수 있음: {validCount}명</span>
                {invalidCount > 0 && (
                  <span className="text-rose-500 font-medium">오류: {invalidCount}건</span>
                )}
              </div>

              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 text-sm flex items-center justify-between ${
                      row.valid ? '' : 'bg-rose-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.name || '(빈 이름)'}</span>
                      {row.valid && (
                        <span className="text-xs text-muted-foreground">
                          {GRADE_LABELS[row.grade_level]}
                        </span>
                      )}
                    </div>
                    {row.error && <span className="text-xs text-rose-500">{row.error}</span>}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleImport}
                disabled={validCount === 0 || isImporting}
                className="w-full"
              >
                {isImporting ? '가져오는 중...' : `${validCount}명 등록`}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
