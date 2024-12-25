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

function createProject(userId, name, start, goal) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO Project (userId, name, start, goal) VALUES (?, ?, ?, ?)`, [userId, name, start, goal], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function getDateObj() {
    const today = new Date();
    const day = today.getDate()
    const month = today.getMonth()
    const year = today.getFullYear()

    return {day, month, year}
}

function getDayResults(projectId) {
    const {month, year} = getDateObj()

    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM DayResult WHERE projectId = ? AND year = ? AND month = ?`, [projectId, year, month], (err, rows) => {
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

function setResult(projectId, result) {
    const {day, month, year} = getDateObj()

    db.get(`SELECT id FROM DayResult WHERE projectId = ? AND year = ? AND month = ? AND day = ?`, [projectId, year, month, day], (err, row) => {
        if (err) {
            console.error('Error querying database:', err.message);
        } else if (row) {
            db.run(`UPDATE DayResult SET result = ? WHERE id = ?`, [result, row.id]);
        } else {
            db.run(`INSERT INTO DayResult (projectId, year, month, day, result) VALUES (?, ?, ?, ?, ?)`, [projectId, year, month, day, result]);
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
    close,
}

