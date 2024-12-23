const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const migrationsFolderPath = path.join(__dirname, './migrations');

const migrations = fs.readdirSync(migrationsFolderPath).map(file => {
    const filePath = path.join(migrationsFolderPath, file);
    return {name: file, command: fs.readFileSync(filePath).toString()}
})

const db = new sqlite3.Database(path.join(__dirname, './word-count.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

migrations.forEach(({name, command}) => {
    db.serialize(() => {
        db.run(command, (err) => {
            if (err) {
                console.error('Error while running migration:', err.message);
            } else {
                console.log(`Migration ${name} done`);
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

