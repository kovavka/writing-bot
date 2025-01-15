import { Event, EventUser, Sprint, SprintUser, User } from './types'
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

function getAll<T>(sql: string, params: unknown[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

function getOne<T>(sql: string, params: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, row: T) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

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

export function getAllUsers(): Promise<User[]> {
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

export function createEvent(
  startDateTime: string,
  sprintsNumber: number,
  sprintDuration: number,
  status: EventStatus = 'created'
): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Event (startDateTime, sprintsNumber, sprintDuration, status) VALUES (?, ?, ?, ?)`,
      [startDateTime, sprintsNumber, sprintDuration, status],
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

export function getEvent(id: number): Promise<Event | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Event WHERE id = ?`,
      [id],
      (err: Error | null, row: Event | undefined) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
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

export function createEventUser(userId: number, eventId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO EventUser (userId, eventId) VALUES (?, ?)`,
      [userId, eventId],
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

export function updateEventUser(
  userId: number,
  eventId: number,
  active?: 0 | 1,
  startWords?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE EventUser SET active = ?, startWords = ? WHERE userId = ? AND eventId = ?`,
      [active, startWords, userId, eventId],
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

export function getEventUsers(eventId: number, active?: 0 | 1): Promise<EventUser[]> {
  if (active === undefined) {
    return getAll('SELECT * FROM EventUser WHERE eventId = ?', [eventId])
  }

  return getAll('SELECT * FROM EventUser WHERE eventId = ? AND active = ?', [eventId, active])
}

export function getSprint(sprintId: number): Promise<Sprint | undefined> {
  return getOne(`SELECT * FROM Sprint WHERE id = ?`, [sprintId])
}

export function createSprint(eventId: number, startDateTime: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Sprint (eventId, startDateTime) VALUES (?, ?)`,
      [eventId, startDateTime],
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

export function createSprintUser(
  userId: number,
  sprintId: number,
  wordsStart: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO SprintUser (userId, sprintId, wordsStart) VALUES (?, ?, ?)`,
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

export function updateSprintUser(
  userId: number,
  sprintId: number,
  wordsEnd: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE SprintUser SET wordsEnd = ? WHERE userId = ? AND sprintId = ?`,
      [userId, sprintId, wordsEnd],
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

export function getSprintUsers(sprintId: number): Promise<SprintUser[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM SprintUser WHERE sprintId = ?`,
      [sprintId],
      (err: Error | null, rows: SprintUser[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      }
    )
  })
}
