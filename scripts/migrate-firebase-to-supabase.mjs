/**
 * Firebase → Supabase 데이터 마이그레이션 스크립트
 *
 * 사용법: SUPABASE_SERVICE_KEY=xxx node scripts/migrate-firebase-to-supabase.mjs
 *
 * 순서:
 * 1. test_categories → Supabase
 * 2. students → Supabase (ID 매핑 생성)
 * 3. attendance_logs → Supabase (studentId 매핑)
 * 4. homework_logs → Supabase
 * 5. scores → Supabase (studentId + categoryId 매핑)
 * 6. audit_logs → Supabase
 */

import { readFileSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const SUPABASE_URL = 'https://xiyijyvwnogzaoujhbub.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY 환경변수를 설정하세요')
  process.exit(1)
}

// Load Firebase backup
const backup = JSON.parse(readFileSync('scripts/backup/firebase-backup-2026-03-07.json', 'utf8'))
const fb = backup.collections

// ID mappings
const studentIdMap = new Map()   // Firebase ID → Supabase UUID
const categoryIdMap = new Map()  // Firebase ID → Supabase UUID

// Grade text → grade_level enum
function gradeToLevel(grade) {
  if (!grade) return null
  if (grade.match(/[1-6]학년/)) return 'elementary'
  if (grade.match(/중[1-3]/)) return 'middle'
  if (grade.match(/고[1-3]/)) return 'high'
  return 'elementary' // default
}

// Firebase status → Supabase status
function mapStudentStatus(status) {
  if (status === 'IN') return 'present'
  if (status === 'OUT') return 'absent'
  if (status === 'LEAVE') return 'leave'
  return 'absent'
}

// Timestamp (ms) → ISO string
function msToIso(ms) {
  if (!ms) return null
  return new Date(ms).toISOString()
}

// Supabase REST API helper
async function supabaseInsert(table, rows) {
  if (rows.length === 0) return { ok: true, count: 0 }

  // Batch in chunks of 500
  const BATCH_SIZE = 500
  let totalInserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify(chunk),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text, batch: i }
    }
    totalInserted += chunk.length
  }

  return { ok: true, count: totalInserted }
}

// ─── 1. test_categories ───
async function migrateCategories() {
  console.log('\n1. test_categories 마이그레이션...')
  const rows = fb.test_categories.map((c) => {
    const newId = randomUUID()
    categoryIdMap.set(c.id, newId)
    return {
      id: newId,
      name: c.name,
      type: c.type,
      max_score: c.defaultTotalScore || 100,
      is_active: c.isActive !== false,
      sort_order: 0,
      created_at: msToIso(c.createdAt) || new Date().toISOString(),
    }
  })

  const result = await supabaseInsert('test_categories', rows)
  if (result.ok) {
    console.log(`  ✅ ${rows.length}개 카테고리 삽입`)
  } else {
    console.error(`  ❌ 실패:`, result.error)
  }
  return result.ok
}

// ─── 2. students ───
async function migrateStudents() {
  console.log('\n2. students 마이그레이션...')
  const rows = fb.students.map((s) => {
    const newId = randomUUID()
    studentIdMap.set(s.id, newId)
    return {
      id: newId,
      name: s.name,
      grade_level: gradeToLevel(s.grade),
      grade: s.grade || null,
      school: s.school || null,
      parent_phone: s.parentPhone || null,
      is_active: s.isActive !== false,
      current_status: mapStudentStatus(s.currentStatus),
      score_drop_risk: s.scoreDropRisk || false,
      firebase_id: s.id,
    }
  })

  const result = await supabaseInsert('students', rows)
  if (result.ok) {
    console.log(`  ✅ ${rows.length}명 학생 삽입`)
  } else {
    console.error(`  ❌ 실패:`, result.error)
  }
  return result.ok
}

// ─── 3. attendance_logs ───
async function migrateAttendance() {
  console.log('\n3. attendance_logs 마이그레이션...')

  let skipped = 0
  const rows = []

  for (const a of fb.attendance_logs) {
    const studentUuid = studentIdMap.get(a.studentId)
    if (!studentUuid) {
      skipped++
      continue
    }

    const ts = msToIso(a.timestamp)
    let status, checkIn, checkOut

    switch (a.type) {
      case 'ENTER':
        status = 'present'
        checkIn = ts
        break
      case 'LEAVE':
        status = 'leave'
        checkOut = ts
        break
      case 'LATE':
        status = 'present'
        checkIn = ts
        break
      default:
        status = 'present'
        checkIn = ts
    }

    rows.push({
      student_id: studentUuid,
      date: a.date,
      status,
      check_in_time: checkIn || null,
      check_out_time: checkOut || null,
      created_at: ts,
    })
  }

  const result = await supabaseInsert('attendance_logs', rows)
  if (result.ok) {
    console.log(`  ✅ ${rows.length}개 출석 로그 삽입 (${skipped}개 스킵 - 학생 매핑 없음)`)
  } else {
    console.error(`  ❌ 실패:`, result.error)
  }
  return result.ok
}

// ─── 4. homework_logs ───
async function migrateHomework() {
  console.log('\n4. homework_logs 마이그레이션...')

  let skipped = 0
  const rows = []

  for (const h of fb.homework_logs) {
    const studentUuid = studentIdMap.get(h.studentId)
    if (!studentUuid) {
      skipped++
      continue
    }

    rows.push({
      student_id: studentUuid,
      date: h.date,
      score: Math.min(Math.max(h.score || 0, 0), 100),
      note: h.memo || null,
      created_at: msToIso(h.timestamp) || new Date().toISOString(),
    })
  }

  const result = await supabaseInsert('homework_logs', rows)
  if (result.ok) {
    console.log(`  ✅ ${rows.length}개 숙제 로그 삽입 (${skipped}개 스킵)`)
  } else {
    console.error(`  ❌ 실패:`, result.error)
  }
  return result.ok
}

// ─── 5. scores ───
async function migrateScores() {
  console.log('\n5. scores 마이그레이션...')

  let skipped = 0
  const rows = []

  for (const s of fb.scores) {
    const studentUuid = studentIdMap.get(s.studentId)
    const categoryUuid = categoryIdMap.get(s.categoryId)
    if (!studentUuid || !categoryUuid) {
      skipped++
      continue
    }

    rows.push({
      student_id: studentUuid,
      category_id: categoryUuid,
      score: s.score,
      date: s.date,
      note: s.note || null,
      created_at: msToIso(s.timestamp) || new Date().toISOString(),
    })
  }

  const result = await supabaseInsert('scores', rows)
  if (result.ok) {
    console.log(`  ✅ ${rows.length}개 성적 삽입 (${skipped}개 스킵)`)
  } else {
    console.error(`  ❌ 실패:`, result.error)
  }
  return result.ok
}

// ─── 6. audit_logs ───
async function migrateAuditLogs() {
  console.log('\n6. audit_logs 마이그레이션...')

  const rows = fb.audit_logs.map((a) => ({
    action: a.action,
    entity_type: a.targetId ? 'student' : null,
    entity_id: a.targetId || null,
    details: a.details || a.metadata || null,
    device_info: [a.deviceName, a.osName, a.osVersion].filter(Boolean).join(' / ') || null,
    ip_address: a.ipAddress || null,
    created_at: msToIso(a.timestamp) || new Date().toISOString(),
  }))

  const result = await supabaseInsert('audit_logs', rows)
  if (result.ok) {
    console.log(`  ✅ ${rows.length}개 감사 로그 삽입`)
  } else {
    console.error(`  ❌ 실패:`, result.error)
  }
  return result.ok
}

// ─── Main ───
async function main() {
  console.log('=== Firebase → Supabase 데이터 마이그레이션 ===')
  console.log(`Firebase 백업: scripts/backup/firebase-backup-2026-03-07.json`)
  console.log(`Supabase: ${SUPABASE_URL}`)

  const results = []

  results.push(await migrateCategories())
  results.push(await migrateStudents())
  results.push(await migrateAttendance())
  results.push(await migrateHomework())
  results.push(await migrateScores())
  results.push(await migrateAuditLogs())

  // Save ID mappings for reference
  const mappings = {
    students: Object.fromEntries(studentIdMap),
    categories: Object.fromEntries(categoryIdMap),
    exportedAt: new Date().toISOString(),
  }
  writeFileSync('scripts/backup/id-mappings.json', JSON.stringify(mappings, null, 2))
  console.log('\n📁 ID 매핑 저장: scripts/backup/id-mappings.json')

  const success = results.filter(Boolean).length
  const failed = results.length - success
  console.log(`\n=== 완료: ${success}/${results.length} 성공, ${failed} 실패 ===`)

  if (failed > 0) process.exit(1)
}

main().catch(console.error)
