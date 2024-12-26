const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const commands = [
    `CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS Project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    dateStart TEXT NOT NULL,
    dateEnd TEXT NOT NULL,
    wordsStart INTEGER NOT NULL,
    wordsGoal INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES User (id)
    )`,

    `CREATE TABLE IF NOT EXISTS DayResult (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL,
    date TEXT NOT NULL,
    words INTEGER NOT NULL,
    FOREIGN KEY (projectId) REFERENCES Project (id)
    )`
]
const db = new sqlite3.Database(path.join(__dirname, './word-count.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

commands.forEach((command) => {
    db.serialize(() => {
        db.run(command, (err) => {
            if (err) {
                console.error('Error while running migration:', err.message);
            } else {
                console.log(`Table created`);
            }
        });
    });
})

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});


