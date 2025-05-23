import { Event, EventStatData, EventUser, Sprint, SprintUser, User } from './types'
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

function getOne<T>(sql: string, params: unknown[]): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: T) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

function update(sql: string, params: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: Error | null) => {
      if (err) {
        reject(err)
      } else {
        resolve()
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
  return getOne<Event>(`SELECT * FROM Event WHERE id = ?`, [id])
}

export function getAllEvents(status: EventStatus): Promise<Event[]> {
  return getAll<Event>(`SELECT * FROM Event WHERE status = ?`, [status])
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

export function createEventUser(
  userId: number,
  eventId: number,
  active?: 0 | 1,
  startWords?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO EventUser (userId, eventId, active, startWords) VALUES (?, ?, ?, ?)`,
      [userId, eventId, active, startWords],
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

export function updateEventUser(userId: number, eventId: number, active: 0 | 1): Promise<void> {
  return update(`UPDATE EventUser SET active = ? WHERE userId = ? AND eventId = ?`, [
    active,
    userId,
    eventId,
  ])
}

export function getEventUsers(eventId: number, active?: 0 | 1): Promise<EventUser[]> {
  if (active === undefined) {
    return getAll<EventUser>('SELECT * FROM EventUser WHERE eventId = ?', [eventId])
  }

  return getAll<EventUser>('SELECT * FROM EventUser WHERE eventId = ? AND active = ?', [
    eventId,
    active,
  ])
}

export function getEventUser(userId: number, eventId: number): Promise<EventUser | undefined> {
  return getOne<EventUser>('SELECT * FROM EventUser WHERE eventId = ? AND userId = ?', [
    eventId,
    userId,
  ])
}

export function getAllSprints(eventId: number): Promise<Sprint[]> {
  return getAll<Sprint>(`SELECT * FROM Sprint WHERE eventId = ?`, [eventId])
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
  startWords: number,
  finalWords: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO SprintUser (userId, sprintId, startWords, finalWords) VALUES (?, ?, ?, ?)`,
      [userId, sprintId, startWords, finalWords],
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
  startWords: number,
  finalWords: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE SprintUser SET startWords = ?, finalWords = ? WHERE userId = ? AND sprintId = ?`,
      [startWords, finalWords, userId, sprintId],
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

export function getSprintUser(
  userId: number,
  sprintId: number
): Promise<SprintUser | undefined> {
  return getOne(`SELECT * FROM SprintUser WHERE userId = ? AND sprintId = ?`, [
    userId,
    sprintId,
  ])
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

export function getEventStat(eventId: number): Promise<EventStatData[]> {
  return getAll<EventStatData>(
    `
SELECT
    user.id AS userId,
    user.name AS userName,
    sprintUser.sprintId AS sprintId,
    sprintUser.startWords,
    sprintUser.finalWords
FROM EventUser eventUser
JOIN Sprint sprint ON sprint.eventId = eventUser.eventId 
JOIN SprintUser sprintUser ON sprintUser.userId = eventUser.userId AND sprintUser.sprintId = sprint.id
JOIN USER user ON user.id = sprintUser.userId
WHERE eventUser.eventId = ?`,
    [eventId]
  )
}
