-- DMRC Smart Ticketing System - PostgreSQL Schema

-- 1. Table: User
CREATE TABLE IF NOT EXISTS Users (
    User_id SERIAL PRIMARY KEY,
    First_name VARCHAR(50) NOT NULL,
    Last_name VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone_no VARCHAR(15) UNIQUE NOT NULL,
    Registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: Biometric Detail
-- Stores the 128-dimensional face embedding (mathematical face vector)
CREATE TABLE IF NOT EXISTS Biometric_Detail (
    Biometric_id SERIAL PRIMARY KEY,
    User_id INT NOT NULL,
    Biometric_data FLOAT[] NOT NULL,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_bio FOREIGN KEY(User_id) REFERENCES Users(User_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_bio UNIQUE(User_id)
);

-- 3. Table: Station
CREATE TABLE IF NOT EXISTS Station (
    Station_id SERIAL PRIMARY KEY,
    Station_name VARCHAR(100) UNIQUE NOT NULL,
    Line_color VARCHAR(50) NOT NULL,
    Coordinates POINT
);

-- 4. Table: Wallet
CREATE TABLE IF NOT EXISTS Wallet (
    Wallet_id SERIAL PRIMARY KEY,
    User_id INT NOT NULL,
    Current_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (Current_balance >= 0),
    CONSTRAINT fk_user_wallet FOREIGN KEY(User_id) REFERENCES Users(User_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_wallet UNIQUE(User_id)
);

-- 5. Table: Transaction
-- Records every journey
CREATE TABLE IF NOT EXISTS Transaction (
    Transaction_id SERIAL PRIMARY KEY,
    User_id INT NOT NULL,
    Source_station INT NOT NULL,
    Destination_station INT,
    Fare_amount DECIMAL(10,2) CHECK (Fare_amount >= 0),
    Transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_txn FOREIGN KEY(User_id) REFERENCES Users(User_id),
    CONSTRAINT fk_source_station FOREIGN KEY(Source_station) REFERENCES Station(Station_id),
    CONSTRAINT fk_dest_station FOREIGN KEY(Destination_station) REFERENCES Station(Station_id)
);
