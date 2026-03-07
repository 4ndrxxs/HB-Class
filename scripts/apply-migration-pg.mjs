/**
 * Supabase 마이그레이션 적용 스크립트 (pg 직접 연결)
 *
 * 사용법: SUPABASE_DB_PASSWORD=xxx node scripts/apply-migration-pg.mjs
 */

import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const { Client } = pg

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD
if (!DB_PASSWORD) {
  console.error('SUPABASE_DB_PASSWORD 환경변수를 설정하세요')
  process.exit(1)
}

const migrationFile = process.argv[2] || 'supabase/migrations/005_unified_schema.sql'
const fullSql = readFileSync(resolve(migrationFile), 'utf-8')

// Try direct connection (IPv6 supported by Node.js)
const connectionConfigs = [
  {
    label: 'Direct (db host)',
    host: 'db.xiyijyvwnogzaoujhbub.supabase.co',
    port: 5432,
    user: 'postgres',
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
  {
    label: 'Pooler Transaction (port 6543)',
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.xiyijyvwnogzaoujhbub',
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
  {
    label: 'Pooler Session (port 5432)',
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.xiyijyvwnogzaoujhbub',
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  },
]

async function tryConnect(config) {
  const client = new Client(config)
  try {
    await client.connect()
    const res = await client.query('SELECT current_database(), version()')
    console.log(`✅ 연결 성공: ${config.label}`)
    console.log(`   DB: ${res.rows[0].current_database}`)
    return client
  } catch (err) {
    console.log(`❌ ${config.label}: ${err.message}`)
    try { await client.end() } catch {}
    return null
  }
}

async function main() {
  console.log(`📄 마이그레이션: ${migrationFile}`)
  console.log(`\n🔌 연결 시도 중...\n`)

  let client = null
  for (const config of connectionConfigs) {
    client = await tryConnect(config)
    if (client) break
  }

  if (!client) {
    console.error('\n❌ 모든 연결 방법 실패')
    process.exit(1)
  }

  console.log(`\n🚀 마이그레이션 실행 중...\n`)

  try {
    // Execute the entire migration as a single transaction
    await client.query('BEGIN')
    await client.query(fullSql)
    await client.query('COMMIT')
    console.log('\n✅ 마이그레이션 성공!')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(`\n❌ 마이그레이션 실패: ${err.message}`)

    // If full SQL fails, try statement by statement
    console.log('\n📝 개별 문 실행으로 재시도...\n')
    try {
      await client.query(fullSql)
      console.log('\n✅ 마이그레이션 성공 (개별 실행)')
    } catch (err2) {
      console.error(`❌ 개별 실행도 실패: ${err2.message}`)
    }
  } finally {
    await client.end()
  }
}

main().catch(console.error)
