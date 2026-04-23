# DMRC Smart Ticketing System 🚇

A modern, full-stack web application designed to digitize and enhance the Delhi Metro ticketing process. This system replaces physical tickets/cards with **biometric face authentication**, features an intelligent Dijkstra-powered **route planner**, and includes a unified **digital wallet**.

---

## 🎯 Key Features

1. **Face-based Authentication**: A secondary biometric layer using your webcam. Face authentication is mandatory to securely **login** to the platform and to authorize **buying a ticket**. (It is not used at physical metro entry/exit gates).
2. **Smart Route Navigation**: Calculates the shortest path, estimated fare, and line changes across 248 DMRC stations.
3. **Digital Wallet Engine**: Top-up funds to auto-deduct fare smoothly.
4. **Pre-Buy Ticket UI**: Buy predefined journey tickets directly from the Route Planner via webcam verification.

---

## 📂 Project Structure

```
DMRC_Ticketing_System/
│
├── Backend/                       # Python Flask API
│   ├── main.py                    # Entry point for backend
│   ├── db.py                      # MySQL Connection Pool
│   ├── .env                       # Database credentials
│   ├── requirements.txt           # Python dependencies
│   ├── seed_stations.py           # Script to populate Station DB
│   │
│   ├── Module_1_User_Management/  # Registration, Login, Biometric extraction (DeepFace/ArcFace)
│   ├── Module_2_Route_Navigator/  # Dijkstra Route logic based on local transit graphs
│   ├── Module_3_Face_Auth/        # Core face matching logic 
│   └── Module_4_Wallet_Engine/    # Balance, Transactions, Buy-ticket logic
│
├── Frontend/                      # React + TypeScript + Vite UI
│   ├── index.html                 # App entry
│   ├── package.json               # NPM Node dependencies
│   └── src/
│       ├── api.ts                 # Clean axios/fetch wrappers for backend calls
│       ├── App.tsx                # Frontend Router
│       ├── index.css              # Custom UI System (Dark Theme)
│       └── pages/                 # UI Views (Login, Dashboard, RoutePlanner, Register)
│
└── Database/                      # SQL Schema & Models
    └── schema.sql                 # MySQL Table definitions
```

---

## 🚀 First-Time Setup Instructions

Follow these steps exactly if this is the first time running this project on your machine.

### 1. Database Setup (MySQL)
1. Open MySQL Workbench (or MySQL terminal).
2. Create the database and import the schema by copying and running the entire contents of `Database/schema.sql`.
3. Create a `.env` file inside the `Backend/` folder (if it doesn't exist) and match your local MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root@admin
   DB_NAME=dmrc_ticketing
   ```

### 2. Backend Setup
1. Open a new terminal and navigate to the `Backend` folder:
   ```bash
   cd Backend
   ```
2. Install Python dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```
3. **Seed the database stations:** 
   Run this script to inject the predefined local DMRC stations into your MySQL database:
   ```bash
   python3 seed_stations.py
   ```

### 3. Frontend Setup
1. Open an additional new terminal and navigate to the `Frontend` folder:
   ```bash
   cd Frontend
   ```
2. Install the necessary Node packages:
   ```bash
   npm install
   ```

---

## 🏃 How to Run the App (Every Time)

Whenever you want to use the app, you need to start **both** the backend and the frontend.

### Terminal 1: Start the Backend Layer
```bash
cd Backend
python3 main.py
```
*Wait for the console to say `Running on http://0.0.0.0:8000/`. Keep this terminal open.*

### Terminal 2: Start the Frontend UI
```bash
cd Frontend
npm run dev
```
*It will give you a local URL (e.g. `http://localhost:5173`). Cmd + Click the link to open it in your browser.*

---

## 🧠 Model Downloads (Important)
The first time you try to register an account or scan your face, the backend's DeepFace engine will silently download the **ArcFace face recognition model** (~35MB) to your machine (in `~/.deepface/weights/`). 

Depending on your internet speed, this might take 1–3 minutes. The screen will display a loading spinner. Do not close the window. **After the first time, all future face scans will be instantaneous.**

---

## 🛠️ Stack Overview
* **UI**: React 18, Vite, Vanilla CSS
* **API**: Flask, Python 3.9+
* **Database**: MySQL 8.0+
* **AI/Biometrics**: DeepFace, TensorFlow (ArcFace backend)
