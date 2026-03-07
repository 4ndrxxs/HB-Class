/**
 * Supabase → JSON 백업 스크립트
 *
 * 사용법: SUPABASE_SERVICE_KEY=xxx node scripts/backup/supabase-export.mjs
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://xiyijyvwnogzaoujhbub.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY 환경변수를 설정하세요')
  console.error('사용법: SUPABASE_SERVICE_KEY=xxx node scripts/backup/supabase-export.mjs')
  process.exit(1)
}

const TABLES = [
  'profiles',
  'students',
  'regular_schedules',
  'schedule_events',
  'academy_settings',
  'academy_codes',
]

async function fetchTable(tableName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  })
  if (!res.ok) {
    console.error(`  ❌ ${tableName}: HTTP ${res.status}`)
    return []
  }
  return res.json()
}

async function main() {
  console.log('=== Supabase 백업 시작 ===')
  console.log(`프로젝트: ${SUPABASE_URL}`)
  console.log(`시각: ${new Date().toISOString()}\n`)

  const backup = {
    version: 1,
    supabaseUrl: SUPABASE_URL,
    exportedAt: new Date().toISOString(),
    tables: {},
  }

  let totalRows = 0
  for (const table of TABLES) {
    process.stdout.write(`📦 ${table} ... `)
    const rows = await fetchTable(table)
    backup.tables[table] = rows
    totalRows += rows.length
    console.log(`${rows.length}개 행`)
  }

  const date = new Date().toISOString().slice(0, 10)
  const fileName = `supabase-backup-${date}.json`
  const filePath = join(__dirname, fileName)

  writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8')

  console.log(`\n✅ 백업 완료!`)
  console.log(`총 ${totalRows}개 행 → ${filePath}`)
}

main().catch(console.error)
