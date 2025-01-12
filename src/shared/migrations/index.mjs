import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import moment from 'moment-timezone'

function getAppliedMigrations(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT name FROM Migration', (err, rows) => {
      if (err) return reject(err)
      resolve(rows.map(row => row.name))
    })
  })
}

function applyMigration(db, name, command) {
  const date = moment().format('YYYY-MM-DD')

  return new Promise((resolve, reject) => {
    db.run(command, err => {
      if (err) {
        console.error('Error while running migration:', err.message)
        reject()
      } else {
        db.run('INSERT INTO Migration (name, date) VALUES (?, ?)', [name, date], err => {
          if (err) {
            console.error(err.message)
            reject()
          } else {
            console.log(`Migration ${name} done`)
            resolve()
          }
        })
      }
    })
  })
}

function createMigrationTable(db) {
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

export async function run(pathToDB, pathToMigrations) {
  const migrations = fs.readdirSync(pathToMigrations).map(file => {
    const filePath = path.join(pathToMigrations, file)
    return { name: file, command: fs.readFileSync(filePath).toString() }
  })

  const db = new sqlite3.Database(pathToDB, err => {
    if (err) {
      console.error('Error opening database:', err.message)
    } else {
      console.log('Connected to the SQLite database.')
    }
  })

  await createMigrationTable(db)

  const appliedMigrations = await getAppliedMigrations(db)

  for (const migration of migrations) {
    const { name, command } = migration
    if (!appliedMigrations.includes(name)) {
      await applyMigration(db, name, command)
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
