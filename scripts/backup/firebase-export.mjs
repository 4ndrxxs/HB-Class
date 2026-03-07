/**
 * Firebase Firestore → JSON 백업 스크립트
 *
 * Firebase REST API를 사용하여 모든 컬렉션을 로컬 JSON 파일로 export.
 * SDK 설치 불필요 — Node.js 내장 fetch 사용.
 *
 * 사용법: node scripts/backup/firebase-export.mjs
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Firebase 프로젝트 설정 (HBchecker/HBscore 공유)
const PROJECT_ID = 'hbchecker'
const API_KEY = 'AIzaSyBIWs2FkoChai897FCCK8Lui0FV50VtLcM'
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

// 백업 대상 컬렉션 (HBchecker + HBscore 통합)
const COLLECTIONS = [
  'students',
  'attendance_logs',
  'homework_logs',
  'scores',
  'test_categories',
  'users',
  'audit_logs',
  'sms_logs',
  'settings',
]

/**
 * Firestore REST API 응답을 일반 JS 객체로 변환
 */
function parseFirestoreValue(value) {
  if (value.stringValue !== undefined) return value.stringValue
  if (value.integerValue !== undefined) return parseInt(value.integerValue)
  if (value.doubleValue !== undefined) return value.doubleValue
  if (value.booleanValue !== undefined) return value.booleanValue
  if (value.nullValue !== undefined) return null
  if (value.timestampValue !== undefined) return value.timestampValue
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(parseFirestoreValue)
  }
  if (value.mapValue !== undefined) {
    return parseFirestoreFields(value.mapValue.fields || {})
  }
  if (value.geoPointValue !== undefined) return value.geoPointValue
  if (value.referenceValue !== undefined) return value.referenceValue
  return value
}

function parseFirestoreFields(fields) {
  const result = {}
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(value)
  }
  return result
}

/**
 * 컬렉션의 모든 문서를 가져옴 (페이지네이션 포함)
 */
async function fetchCollection(collectionName) {
  const docs = []
  let pageToken = null
  let page = 0

  do {
    const params = new URLSearchParams({ key: API_KEY, pageSize: '300' })
    if (pageToken) params.set('pageToken', pageToken)

    const url = `${BASE_URL}/${collectionName}?${params}`
    const res = await fetch(url)

    if (!res.ok) {
      const errText = await res.text()
      console.error(`  ❌ ${collectionName}: HTTP ${res.status} — ${errText.slice(0, 200)}`)
      return docs
    }

    const data = await res.json()
    const documents = data.documents || []

    for (const doc of documents) {
      // doc.name 형식: "projects/hbchecker/databases/(default)/documents/students/ABC123"
      const parts = doc.name.split('/')
      const docId = parts[parts.length - 1]
      const fields = parseFirestoreFields(doc.fields || {})
      docs.push({ id: docId, ...fields })
    }

    pageToken = data.nextPageToken || null
    page++
    if (page > 1) process.stdout.write('.')
  } while (pageToken)

  return docs
}

async function main() {
  console.log('=== Firebase Firestore 백업 시작 ===')
  console.log(`프로젝트: ${PROJECT_ID}`)
  console.log(`시각: ${new Date().toISOString()}\n`)

  const backup = {
    version: 1,
    projectId: PROJECT_ID,
    exportedAt: new Date().toISOString(),
    collections: {},
  }

  let totalDocs = 0

  for (const col of COLLECTIONS) {
    process.stdout.write(`📦 ${col} ... `)
    const docs = await fetchCollection(col)
    backup.collections[col] = docs
    totalDocs += docs.length
    console.log(`${docs.length}개 문서`)
  }

  // 파일 저장
  const date = new Date().toISOString().slice(0, 10)
  const fileName = `firebase-backup-${date}.json`
  const filePath = join(__dirname, fileName)

  writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8')

  console.log(`\n✅ 백업 완료!`)
  console.log(`총 ${totalDocs}개 문서 → ${filePath}`)
  console.log(`파일 크기: ${(Buffer.byteLength(JSON.stringify(backup)) / 1024).toFixed(1)} KB`)
}

main().catch(console.error)
