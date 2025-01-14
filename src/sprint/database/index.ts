import { User } from './types'
import sqlite3 from 'sqlite3'
import path from 'path'
import { EventStatus } from '../types'

const db = new sqlite3.Database(path.join(__dirname, './sprint.db'), (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to the SQLite database.')
  }
})

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
    db.run(`INSERT INTO User (id, name) VALUES (?, ?)`, [id, name], (err: Error | null) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
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

export function createEvent(
  startDate: string,
  startTime: string,
  sprintsNumber: number,
  sprintDuration: number,
  status: EventStatus = 'created'
): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Event (startDate, startTime, sprintsNumber, sprintDuration, status) VALUES (?, ?, ?, ?, ?)`,
      [startDate, startTime, sprintsNumber, sprintDuration, status],
      function (err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve(this.lastID)
        }
      }
    )
  })
}

export function updateEventStatus(id: number, status: EventStatus): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE Event SET status = ? WHERE id = ?`, [status, id], (err: Error | null) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export function getUsers(): Promise<User[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM User`, [], (err: Error | null, rows: User[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

export function createSprint(
  eventId: number,
  startDate: string,
  startTime: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Sprint (eventId, startDate, startTime) VALUES (?, ?, ?)`,
      [eventId, startDate, startTime],
      function (err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve(this.lastID)
        }
      }
    )
  })
}

export function joinSprint(
  userId: number,
  sprintId: number,
  wordsStart: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO UserSprint (userId, sprintId, wordsStart) VALUES (?, ?)`,
      [userId, sprintId, wordsStart],
      (err: Error | null) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}
