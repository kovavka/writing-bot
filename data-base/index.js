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

function createEvent(length, sprintDuration) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO Event (length, sprintDuration) VALUES (?, ?)`, [length, sprintDuration], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function createSprint(eventId) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO Sprint (eventId) VALUES (?)`, [eventId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function joinSprint(userId, sprintId, wordsStart) {
    db.run(`INSERT INTO UserSprint (userId, sprintId, wordsStart) VALUES (?, ?)`, [userId, sprintId, wordsStart]);
}

module.exports = {
    addUser,
    createEvent,
    createSprint,
    joinSprint,
    close,
}

