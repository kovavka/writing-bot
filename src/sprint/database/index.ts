import { User } from './types'
import sqlite3 from 'sqlite3'
import path from 'path'

const db = new sqlite3.Database(
  path.join(__dirname, './word-count.db'),
  (err: Error | null) => {
    if (err) {
      console.error('Error opening database:', err.message)
    } else {
      console.log('Connected to the SQLite database.')
    }
  }
)

export function close(): void {
  db.close((err: Error | null) => {
    if (err) {
      console.error('Error closing database:', err.message)
    } else {
      console.log('Database connection closed.')
    }
  })
}

export function getUser(id: number): Promise<User | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM User WHERE id = ?`,
      [id],
      (err: Error | null, row: User | undefined) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      }
    )
  })
}

export function addUser(id: number, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM User WHERE id = ?`,
      [id],
      (err: Error | null, row: User | undefined) => {
        if (err) {
          reject(err)
        } else if (row === undefined) {
          resolve()
        } else {
          db.run(
            `INSERT INTO User (id, name) VALUES (?, ?)`,
            [id, name],
            (err: Error | null) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
        }
      }
    )
  })
}

export function updateUser(id: number, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE User SET name = ? WHERE id = ?`, [name, id], (err: Error | null) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
