CREATE TABLE IF NOT EXISTS EventUser (
    eventId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    active INTEGER,
    startWords INTEGER,
    PRIMARY KEY (eventId, userId),
    FOREIGN KEY (eventId) REFERENCES Event (id),
    FOREIGN KEY (userId) REFERENCES User (id)
)