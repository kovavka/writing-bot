const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, './word-count.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

export function close() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}

export function getUser(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM User WHERE id = ?`, [id], (err, row) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (row) {
                resolve(row)
            } else {
                resolve(undefined)
            }
        });
    });
}

export function addUser(id, name) {
    db.get(`SELECT id FROM User WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Error querying database:', err.message);
        } else if (row) {
        } else {
            db.run(`INSERT INTO User (id, name) VALUES (?, ?)`, [id, name]);
        }
    });
}

export function updateUser(id, name) {
    db.run(`UPDATE User SET name = ? WHERE id = ?`, [name, id], (err) => {
        if (err) {
            console.error('Error querying database:', err.message);
        }
    });
}

export function createProject(userId, name, dateStart, dateEnd, wordsStart, wordsGoal): Promise<number> {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO Project (userId, name, dateStart, dateEnd, wordsStart, wordsGoal) VALUES (?, ?, ?, ?, ?, ?)`, [userId, name, dateStart, dateEnd, wordsStart, wordsGoal], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

export function renameProject(projectId, name) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE Project SET name = ? WHERE id = ?`, [name, projectId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export function hideProject(projectId, date) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE Project SET hidden = 1, hiddenDate = ? WHERE id = ?`, [date, projectId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


export function getDayResults(projectId) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM DayResult WHERE projectId = ?`, [projectId], (err, rows) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (rows) {
                resolve(rows)
            } else {
                resolve([])
            }
        });
    });
}

export function getProjects(userId) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM Project WHERE userId = ? AND hidden = 0`, [userId], (err, rows) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (rows) {
                resolve(rows)
            } else {
                resolve([])
            }
        });
    });
}

export function getProject(projectId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM Project WHERE id = ?`, [projectId], (err, row) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (row) {
                resolve(row)
            } else {
                resolve(undefined)
            }
        });
    });
}

export function getCurrentWords(projectId) {
    return new Promise((resolve, reject) => {
        db.get(`
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
WHERE p.id = ?`, [projectId], (err, row) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (row) {
                resolve(row)
            } else {
                resolve(undefined)
            }
        });
    });
}

export function getPrevDayResult(projectId, today) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM DayResult WHERE projectId = ? AND date < ? ORDER BY id DESC LIMIT 1`, [projectId, today], (err, row) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (row) {
                resolve(row)
            } else {
                resolve(undefined)
            }
        });
    });
}

export function setResult(projectId, words, today) {
    db.get(`SELECT id FROM DayResult WHERE projectId = ? AND date = ?`, [projectId, today], (err, row) => {
        if (err) {
            console.error('Error querying database:', err.message);
        } else if (row) {
            db.run(`UPDATE DayResult SET words = ? WHERE id = ?`, [words, row.id]);
        } else {
            db.run(`INSERT INTO DayResult (projectId, date, words) VALUES (?, ?, ?)`, [projectId, today, words]);
        }
    });
}

export function getStatistics(projectStart, projectEnd) {
    return new Promise((resolve, reject) => {
        db.all(`
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
`, [projectStart, projectEnd], (err, rows) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (rows) {
                resolve(rows)
            } else {
                resolve([])
            }
        });
    });
}

export function getTodayStatistics(resultDate) {
    return new Promise((resolve, reject) => {
        db.all(`
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
`, [resultDate, resultDate], (err, rows) => {
            if (err) {
                console.error('Error querying database:', err.message);
                reject(err);
            } else if (rows) {
                resolve(rows)
            } else {
                resolve([])
            }
        });
    });
}


module.exports = {
    getUser,
    addUser,
    updateUser,
    createProject,
    renameProject,
    hideProject,
    getDayResults,
    getProjects,
    getProject,
    setResult,
    getPrevDayResult,
    getCurrentWords,
    getStatistics,
    getTodayStatistics,
    close,
}

