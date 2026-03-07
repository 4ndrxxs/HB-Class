import { readFileSync } from 'fs'
const data = JSON.parse(readFileSync('scripts/backup/firebase-backup-2026-03-07.json', 'utf8'))

for (const [col, docs] of Object.entries(data.collections)) {
  console.log(`${col}: ${docs.length} docs`)
  if (docs.length > 0) {
    const sample = docs[0].fields || docs[0]
    console.log('  fields:', Object.keys(sample).join(', '))
    // Show first doc field types
    const types = {}
    for (const [k, v] of Object.entries(sample)) {
      if (typeof v === 'object' && v !== null) {
        types[k] = Object.keys(v)[0] // Firestore REST type
      }
    }
    console.log('  types:', JSON.stringify(types))
  }
  console.log()
}
