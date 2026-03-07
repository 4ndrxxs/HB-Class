import { readFileSync } from 'fs'
const data = JSON.parse(readFileSync('scripts/backup/firebase-backup-2026-03-07.json', 'utf8'))

// Show 2 samples from key collections
const show = ['students', 'attendance_logs', 'homework_logs', 'scores', 'test_categories', 'users']
for (const col of show) {
  const docs = data.collections[col] || []
  console.log(`\n=== ${col} (${docs.length}) ===`)
  docs.slice(0, 2).forEach((d, i) => {
    console.log(`[${i}]`, JSON.stringify(d, null, 2))
  })
}
