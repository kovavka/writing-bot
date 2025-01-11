import {
  DayResult,
  FullStatData,
  Project,
  ProjectCurrentWords,
  TodayStatData,
  User,
} from './types'
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

export function createProject(
  userId: number,
  name: string,
  dateStart: string,
  dateEnd: string,
  wordsStart: number,
  wordsGoal: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Project (userId, name, dateStart, dateEnd, wordsStart, wordsGoal) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, dateStart, dateEnd, wordsStart, wordsGoal],
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

export function renameProject(projectId: number, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Project SET name = ? WHERE id = ?`,
      [name, projectId],
      function (err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

export function updateProjectGoal(projectId: number, goal: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Project SET wordsGoal = ? WHERE id = ?`,
      [goal, projectId],
      function (err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

export function hideProject(projectId: number, date: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Project SET hidden = 1, hiddenDate = ? WHERE id = ?`,
      [date, projectId],
      function (err: Error | null) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

export function getDayResults(projectId: number): Promise<DayResult[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM DayResult WHERE projectId = ?`,
      [projectId],
      (err: Error | null, rows: DayResult[]) => {
        if (err) {
          console.error('Error querying database:', err.message)
          reject(err)
        } else {
          resolve(rows)
        }
      }
    )
  })
}

export function getProjects(userId: number): Promise<Project[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM Project WHERE userId = ? AND hidden = 0`,
      [userId],
      (err: Error | null, rows: Project[]) => {
        if (err) {
          console.error('Error querying database:', err.message)
          reject(err)
        } else {
          resolve(rows)
        }
      }
    )
  })
}

export function getProject(projectId: number): Promise<Project | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Project WHERE id = ?`,
      [projectId],
      (err: Error | null, row: Project | undefined) => {
        if (err) {
          console.error('Error querying database:', err.message)
          reject(err)
        } else {
          resolve(row)
        }
      }
    )
  })
}

export function getCurrentWords(projectId: number): Promise<ProjectCurrentWords | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `
SELECT 
    p.id,
    p.name,
    p.wordsStart,
    p.wordsGoal,
    dr.date AS latestDate,
    dr.words AS latestWords
FROM Project p
LEFT JOIN (
    SELECT 
        projectId, 
        date, 
        words 
    FROM DayResult dr1
    WHERE dr1.date = (
        SELECT MAX(dr2.date)
        FROM DayResult dr2
        WHERE dr1.projectId = dr2.projectId
    )
) dr ON p.id = dr.projectId
WHERE p.id = ?`,
      [projectId],
      (err: Error | null, row: ProjectCurrentWords | undefined) => {
        if (err) {
          console.error('Error querying database:', err.message)
          reject(err)
        } else {
          resolve(row)
        }
      }
    )
  })
}

export function getPrevDayResult(
  projectId: number,
  today: string
): Promise<DayResult | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM DayResult WHERE projectId = ? AND date < ? ORDER BY id DESC LIMIT 1`,
      [projectId, today],
      (err: Error | null, row: DayResult | undefined) => {
        if (err) {
          console.error('Error querying database:', err.message)
          reject(err)
        } else {
          resolve(row)
        }
      }
    )
  })
}

// todo promise
export function setResult(projectId: number, words: number, today: string): void {
  db.get(
    `SELECT id FROM DayResult WHERE projectId = ? AND date = ?`,
    [projectId, today],
    (err: Error | null, row: DayResult | undefined) => {
      if (err) {
        console.error('Error querying database:', err.message)
      } else if (row) {
        db.run(`UPDATE DayResult SET words = ? WHERE id = ?`, [words, row.id])
      } else {
        db.run(`INSERT INTO DayResult (projectId, date, words) VALUES (?, ?, ?)`, [
          projectId,
          today,
          words,
        ])
      }
    }
  )
}

export function getStatistics(
  projectStart: string,
  projectEnd: string
): Promise<FullStatData[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `
SELECT 
    u.id AS userId,
    u.name AS userName,
    p.id AS projectId,
    p.name AS projectName,
    p.dateStart,
    p.dateEnd,
    p.wordsStart,
    p.wordsGoal,
    dr.date AS latestDate,
    dr.words AS latestWords
FROM User u
JOIN Project p ON u.id = p.userId
LEFT JOIN (
    SELECT 
        projectId, 
        date, 
        words 
    FROM DayResult dr1
    WHERE dr1.date = (
        SELECT MAX(dr2.date)
        FROM DayResult dr2
        WHERE dr1.projectId = dr2.projectId
    )
) dr ON p.id = dr.projectId
WHERE p.dateStart >= ? AND p.dateEnd <= ? AND p.hidden = 0;
`,
      [projectStart, projectEnd],
      (err: Error | null, rows: FullStatData[]) => {
        if (err) {
          console.error('Error querying database:', err.message)
          reject(err)
        } else {
          resolve(rows)
        }
      }
    )
  })
}

export function getTodayStatistics(resultDate: string): Promise<TodayStatData[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `
SELECT 
    dr1.date AS todayDate,
    dr1.words AS todayWords,
    dr2.date AS lastResultDate,
    dr2.words AS lastResultWords,
    p.name AS projectName,
    p.wordsStart,
    u.id AS userId,
    u.name AS userName
FROM DayResult dr1
JOIN Project p ON p.id = dr1.projectId
JOIN User u ON u.id = p.userId
LEFT JOIN (
    SELECT 
        projectId, 
        date, 
        words 
    FROM DayResult res1
    WHERE res1.date = (
        SELECT MAX(res2.date)
        FROM DayResult res2
        WHERE res1.projectId = res2.projectId AND res2.date < ?
    )
) dr2 ON dr1.projectId = dr2.projectId
WHERE dr1.date = ?
`,
      [resultDate, resultDate],
      (err: Error | null, rows: TodayStatData[]) => {
        if (err) {
          console.error('Error querying database:', err.message)
          reject(err)
        } else {
          resolve(rows)
        }
      }
    )
  })
}
