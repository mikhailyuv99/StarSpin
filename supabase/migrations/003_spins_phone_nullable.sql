-- Phone collected at claim (optional); device fingerprint used at spin time
ALTER TABLE spins ALTER COLUMN phone_number DROP NOT NULL;
