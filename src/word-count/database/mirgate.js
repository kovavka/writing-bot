const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const moment = require('moment-timezone')

const migrationsFolderPath = path.join(__dirname, './migrations')

const migrations = fs.readdirSync(migrationsFolderPath).map(file => {
  const filePath = path.join(migrationsFolderPath, file)
  return { name: file, command: fs.readFileSync(filePath).toString() }
})

const db = new sqlite3.Database(
  path.join(__dirname, './word-count.db'),
  err => {
    if (err) {
      console.error('Error opening database:', err.message)
    } else {
      console.log('Connected to the SQLite database.')
    }
  }
)

function getAppliedMigrations() {
  return new Promise((resolve, reject) => {
    db.all('SELECT name FROM Migration', (err, rows) => {
      if (err) return reject(err)
      resolve(rows.map(row => row.name))
    })
  })
}

function applyMigration(name, command) {
  const date = moment().format('YYYY-MM-DD')

  return new Promise((resolve, reject) => {
    db.run(command, err => {
      if (err) {
        console.error('Error while running migration:', err.message)
        reject()
      } else {
        db.run(
          'INSERT INTO Migration (name, date) VALUES (?, ?)',
          [name, date],
          err => {
            if (err) {
              console.error(err.message)
              reject()
            } else {
              console.log(`Migration ${name} done`)
              resolve()
            }
          }
        )
      }
    })
  })
}

function createMigrationTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS Migration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL
        )`,
      err => {
        if (err) {
          console.error(err.message)
          reject(err)
        } else {
          console.log(`Migration table added`)
          resolve()
        }
      }
    )
  })
}

async function run() {
  await createMigrationTable()

  const appliedMigrations = await getAppliedMigrations()

  for (const migration of migrations) {
    const { name, command } = migration
    if (!appliedMigrations.includes(name)) {
      await applyMigration(name, command)
    }
  }

  db.close(err => {
    if (err) {
      console.error('Error closing database:', err.message)
    } else {
      console.log('Database connection closed.')
    }
  })
}

run()
