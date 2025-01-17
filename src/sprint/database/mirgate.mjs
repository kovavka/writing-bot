import path from 'path'
import { run } from '../../shared/migrations/index.mjs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const migrationsFolderPath = path.join(__dirname, './migrations')
const dbPath = path.join(__dirname, './sprint.db')

run(dbPath, migrationsFolderPath)
