CREATE TABLE IF NOT EXISTS Event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startDate TEXT NOT NULL,
    startTime TEXT NOT NULL,
    sprintsNumber INTEGER NOT NULL,
    sprintDuration INTEGER NOT NULL
    status TEXT NOT NULL
)