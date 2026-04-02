import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL!
const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client)

async function runMigrations() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations complete!')
  await client.end()
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
