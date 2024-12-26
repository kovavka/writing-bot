const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, './word-count.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

function close() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}

function addUser(id, name) {
    db.get(`SELECT id FROM User WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Error querying database:', err.message);
        } else if (row) {
        } else {
            db.run(`INSERT INTO User (id, name) VALUES (?, ?)`, [id, name]);
        }
    });
}

function getDateStr(date) {
    return (date ?? new Date()).toISOString().split('T')[0];
}

function createProject(userId, name, dateStart, dateEnd, wordsStart, wordsGoal) {
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


function getDayResults(projectId) {
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

function getProjects(userId) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM Project WHERE userId = ?`, [userId], (err, rows) => {
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

function getProject(projectId) {
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

function getPrevDayResult(projectId) {
    const today = getDateStr()

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

function setResult(projectId, words) {
    const today = getDateStr()

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

module.exports = {
    addUser,
    createProject,
    getDayResults,
    getProjects,
    getProject,
    setResult,
    getPrevDayResult,
    close,
}

