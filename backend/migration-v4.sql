-- Migration v4: Add telemetry columns to Logs table
ALTER TABLE Logs ADD COLUMN system_vacuum TEXT DEFAULT '-';
ALTER TABLE Logs ADD COLUMN process_vacuum TEXT DEFAULT '-';
ALTER TABLE Logs ADD COLUMN foreline_vacuum TEXT DEFAULT '-';
ALTER TABLE Logs ADD COLUMN installed_gauge TEXT DEFAULT '-';
ALTER TABLE Logs ADD COLUMN connect_machine TEXT DEFAULT '-';
ALTER TABLE Logs ADD COLUMN temperature TEXT DEFAULT '-';
