CREATE TABLE IF NOT EXISTS SprintUser (
    sprintId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    finalWords INTEGER,
    PRIMARY KEY (sprintId, userId),
    FOREIGN KEY (sprintId) REFERENCES Sprint (id),
    FOREIGN KEY (userId) REFERENCES User (id)
)