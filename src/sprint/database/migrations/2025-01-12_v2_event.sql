CREATE TABLE IF NOT EXISTS Event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startDateTime TEXT NOT NULL,
    sprintsNumber INTEGER NOT NULL,
    sprintDuration INTEGER NOT NULL,
    status TEXT NOT NULL
)