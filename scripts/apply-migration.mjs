/**
 * Supabase 마이그레이션 적용 스크립트
 * Supabase REST API + service_role key를 사용하여 SQL 실행
 *
 * 사용법: SUPABASE_SERVICE_KEY=xxx node scripts/apply-migration.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = 'https://xiyijyvwnogzaoujhbub.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY 환경변수를 설정하세요')
  process.exit(1)
}

const migrationFile = process.argv[2] || 'supabase/migrations/005_unified_schema.sql'
const fullSql = readFileSync(resolve(migrationFile), 'utf-8')

console.log(`📄 마이그레이션: ${migrationFile}`)

/**
 * Split SQL into executable statements, handling DO $$ blocks
 */
function splitStatements(sql) {
  const statements = []
  let current = ''
  let inDollarBlock = false
  const lines = sql.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip comment-only lines
    if (trimmed.startsWith('--') && !inDollarBlock) {
      continue
    }

    current += line + '\n'

    // Track DO $$ blocks
    if (trimmed.match(/^DO\s*\$\$/i) || trimmed.match(/AS\s*\$\$/i)) {
      inDollarBlock = true
    }

    if (inDollarBlock && trimmed.match(/^\$\$.*;?\s*$/)) {
      // Check if this is the closing $$
      const dollars = current.match(/\$\$/g)
      if (dollars && dollars.length % 2 === 0) {
        inDollarBlock = false
        if (current.trim()) statements.push(current.trim())
        current = ''
      }
    } else if (!inDollarBlock && trimmed.endsWith(';')) {
      if (current.trim()) statements.push(current.trim())
      current = ''
    }
  }

  if (current.trim()) statements.push(current.trim())
  return statements.filter(s => s && !s.match(/^--/))
}

/**
 * Execute a single SQL statement via Supabase pg endpoint
 */
async function executeSQL(sql) {
  // Try the Supabase SQL execution endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  })

  // Supabase doesn't have a direct SQL exec endpoint via REST API
  // We'll use the management API approach
  return null
}

// Since direct SQL execution via REST isn't available,
// let's create a temporary RPC function first
async function createExecFunction() {
  // This needs to be run via the SQL editor or psql first
  const sql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `
  return sql
}

async function runViaRPC(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ sql }),
  })

  if (res.status === 404) {
    return { error: 'exec_sql function not found', status: 404 }
  }
  if (!res.ok) {
    const text = await res.text()
    return { error: text, status: res.status }
  }
  return { ok: true }
}

async function main() {
  console.log('\n1. exec_sql 함수 존재 여부 확인...')

  // Test if exec_sql already exists
  const test = await runViaRPC("SELECT 1")
  if (test.status === 404) {
    console.log('❌ exec_sql 함수가 없습니다.')
    console.log('\n📋 아래 SQL을 Supabase Dashboard > SQL Editor에서 먼저 실행하세요:\n')
    console.log('CREATE OR REPLACE FUNCTION exec_sql(sql text)')
    console.log('RETURNS void AS $$')
    console.log('BEGIN')
    console.log('  EXECUTE sql;')
    console.log('END;')
    console.log("$$ LANGUAGE plpgsql SECURITY DEFINER;")
    console.log('\n그 후 이 스크립트를 다시 실행하세요.')
    process.exit(1)
  }

  if (test.error && test.status !== 404) {
    // Function exists but might have error - proceed anyway
    console.log(`⚠️ 테스트 결과: ${test.error.slice(0, 100)}`)
  } else {
    console.log('✅ exec_sql 함수 확인됨')
  }

  // Split and execute statements
  const statements = splitStatements(fullSql)
  console.log(`\n2. ${statements.length}개 SQL 문 실행 중...\n`)

  let success = 0
  let errors = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.replace(/\n/g, ' ').slice(0, 80)
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}...`)

    const result = await runViaRPC(stmt)
    if (result.ok) {
      console.log(' ✅')
      success++
    } else {
      console.log(` ❌ ${(result.error || '').slice(0, 100)}`)
      errors++
    }
  }

  console.log(`\n=== 완료: ${success} 성공, ${errors} 실패 ===`)
}

main().catch(console.error)
