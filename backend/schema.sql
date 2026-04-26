-- NÜRDAM Cleanroom Management System — D1 Schema
-- Run: wrangler d1 execute nurdam-db --local --file=./schema.sql

DROP TABLE IF EXISTS Logs;
DROP TABLE IF EXISTS Appointments;
DROP TABLE IF EXISTS Equipment;
DROP TABLE IF EXISTS Users;

-- Users table
CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')) DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Equipment table
CREATE TABLE Equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Appointments table
CREATE TABLE Appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (equipment_id) REFERENCES Equipment(id)
);

-- Logs table
CREATE TABLE Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,
    machine_status TEXT NOT NULL CHECK(machine_status IN ('good', 'needs maintenance', 'offline')),
    observations TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (equipment_id) REFERENCES Equipment(id)
);

-- Indexes for performance
CREATE INDEX idx_appointments_user ON Appointments(user_id);
CREATE INDEX idx_appointments_equipment ON Appointments(equipment_id);
CREATE INDEX idx_appointments_status ON Appointments(status);
CREATE INDEX idx_logs_user ON Logs(user_id);
CREATE INDEX idx_logs_equipment ON Logs(equipment_id);
