-- DMRC Smart Ticketing System - MySQL Schema
-- Compatible with MySQL 8.0+

-- Use InnoDB engine for foreign key support
-- Enable strict mode for CHECK constraint enforcement (MySQL 8.0+)

CREATE DATABASE IF NOT EXISTS dmrc_ticketing;
USE dmrc_ticketing;

-- 1. Table: Users
CREATE TABLE IF NOT EXISTS Users (
    User_id           INT AUTO_INCREMENT PRIMARY KEY,
    First_name        VARCHAR(50)  NOT NULL,
    Last_name         VARCHAR(50)  NOT NULL,
    Email             VARCHAR(100) NOT NULL UNIQUE,
    Phone_no          VARCHAR(15)  NOT NULL UNIQUE,
    Password_hash     VARCHAR(255) NOT NULL,
    Registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NOTE: If Users table already exists without Password_hash, run this once:
-- ALTER TABLE Users ADD COLUMN Password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER Phone_no;

-- 2. Table: Biometric_Detail
-- Stores the 128-dimensional face embedding as a JSON array
-- e.g. [0.123, -0.456, ..., 0.789]  (128 floats)
CREATE TABLE IF NOT EXISTS Biometric_Detail (
    Biometric_id  INT AUTO_INCREMENT PRIMARY KEY,
    User_id       INT  NOT NULL,
    Biometric_data JSON NOT NULL,          -- replaces PostgreSQL FLOAT[]
    Last_update   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_bio     FOREIGN KEY (User_id) REFERENCES Users(User_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_bio UNIQUE (User_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table: Station
CREATE TABLE IF NOT EXISTS Station (
    Station_id   INT AUTO_INCREMENT PRIMARY KEY,
    Station_name VARCHAR(100) NOT NULL UNIQUE,
    Line_color   VARCHAR(50)  NOT NULL,
    Coordinates  POINT NOT NULL,           -- MySQL SPATIAL INDEX requires NOT NULL
    SPATIAL INDEX idx_coordinates (Coordinates)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table: Wallet
CREATE TABLE IF NOT EXISTS Wallet (
    Wallet_id       INT AUTO_INCREMENT PRIMARY KEY,
    User_id         INT            NOT NULL,
    Current_balance DECIMAL(10,2)  NOT NULL DEFAULT 0.00 CHECK (Current_balance >= 0),
    CONSTRAINT fk_user_wallet     FOREIGN KEY (User_id) REFERENCES Users(User_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_wallet UNIQUE (User_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table: Transactions
-- 'Transaction' is a reserved word in MySQL, so renamed to Transactions
CREATE TABLE IF NOT EXISTS Transactions (
    Transaction_id      INT AUTO_INCREMENT PRIMARY KEY,
    User_id             INT           NOT NULL,
    Source_station      INT           NOT NULL,
    Destination_station INT,
    Fare_amount         DECIMAL(10,2) CHECK (Fare_amount >= 0),
    Transaction_date    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_txn        FOREIGN KEY (User_id)             REFERENCES Users(User_id),
    CONSTRAINT fk_source_station  FOREIGN KEY (Source_station)      REFERENCES Station(Station_id),
    CONSTRAINT fk_dest_station    FOREIGN KEY (Destination_station) REFERENCES Station(Station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
