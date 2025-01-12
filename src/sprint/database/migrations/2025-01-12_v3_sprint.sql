CREATE TABLE IF NOT EXISTS Sprint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventId INTEGER NOT NULL,
    FOREIGN KEY (eventId) REFERENCES Event (id)
)