import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DATABASE_URL = process.env.DATABASE_URL!
const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client)

async function runMigrations() {
  const migrationsFolder = resolve(__dirname, '../../drizzle')
  console.log('Running migrations from:', migrationsFolder)
  await migrate(db, { migrationsFolder })
  console.log('Migrations complete!')
  await client.end()
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
