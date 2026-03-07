import { readFileSync } from 'fs'
const data = JSON.parse(readFileSync('scripts/backup/firebase-backup-2026-03-07.json', 'utf8'))

// Unique grades
const grades = new Set()
data.collections.students.forEach(s => grades.add(s.grade))
console.log('Unique grades:', [...grades].sort())

// Unique statuses
const statuses = new Set()
data.collections.students.forEach(s => statuses.add(s.currentStatus))
console.log('Unique statuses:', [...statuses])

// Unique attendance types
const types = new Set()
data.collections.attendance_logs.forEach(a => types.add(a.type))
console.log('Unique attendance types:', [...types])

// Unique user roles
const roles = new Set()
data.collections.users.forEach(u => roles.add(u.role))
console.log('Unique user roles:', [...roles])

// All user IDs and names
console.log('\nUsers:')
data.collections.users.forEach(u => {
  console.log(`  ${u.id}: ${u.name} (${u.role}) approved=${u.isApproved}`)
})

// Unique category IDs used in scores
const catIds = new Set()
data.collections.scores.forEach(s => catIds.add(s.categoryId))
console.log('\nCategory IDs in scores:', [...catIds])

// Check test_categories IDs
console.log('Test category IDs:', data.collections.test_categories.map(c => c.id))
