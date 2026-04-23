from flask import Blueprint, request, jsonify
import json
import numpy as np

from db import get_connection
from Module_1_User_Management.biometric_service import biometric_service
from Module_2_Route_Navigator.route_manager import route_manager

module3 = Blueprint("module3", __name__)

# ---------------------------------------------------------------------------
# Helper: Identify user from all stored embeddings
# ---------------------------------------------------------------------------
def identify_user_by_face(face_image_b64: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        live_emb = biometric_service.get_embedding(face_image_b64)
        if live_emb is None:
            return None

        cursor.execute("SELECT User_id, Biometric_data FROM Biometric_Detail")
        rows = cursor.fetchall()

        best_user_id = None
        best_distance = float("inf")
        THRESHOLD = 10.0

        for row in rows:
            stored = json.loads(row["Biometric_data"])
            dist = float(np.linalg.norm(np.array(stored) - np.array(live_emb)))
            if dist < best_distance:
                best_distance = dist
                best_user_id = row["User_id"]

        return best_user_id if best_distance < THRESHOLD else None
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/v1/gate/scan-entry
# ---------------------------------------------------------------------------
@module3.post("/scan-entry")
def scan_entry():
    data = request.get_json()
    if not data or "face_image_b64" not in data or "station_id" not in data:
        return jsonify({"error": "face_image_b64 and station_id are required."}), 400

    user_id = identify_user_by_face(data["face_image_b64"])
    if user_id is None:
        return jsonify({"error": "Face not recognised. Entry denied."}), 401

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Transactions (User_id, Source_station, Destination_station, Fare_amount) VALUES (%s,%s,NULL,NULL)",
            (user_id, data["station_id"])
        )
        conn.commit()
        return jsonify({
            "message": "Face recognised. Gate opened for entry.",
            "user_id": user_id,
            "transaction_id": cursor.lastrowid,
            "entry_station_id": data["station_id"]
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/v1/gate/scan-exit
# ---------------------------------------------------------------------------
@module3.post("/scan-exit")
def scan_exit():
    data = request.get_json()
    if not data or "face_image_b64" not in data or "station_id" not in data:
        return jsonify({"error": "face_image_b64 and station_id are required."}), 400

    user_id = identify_user_by_face(data["face_image_b64"])
    if user_id is None:
        return jsonify({"error": "Face not recognised. Exit denied."}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Find latest open journey
        cursor.execute(
            "SELECT Transaction_id, Source_station FROM Transactions WHERE User_id=%s AND Destination_station IS NULL ORDER BY Transaction_date DESC LIMIT 1",
            (user_id,)
        )
        txn = cursor.fetchone()
        if not txn:
            return jsonify({"error": "No active journey found for this user."}), 400

        # Get station names for fare calc
        cursor.execute("SELECT Station_name FROM Station WHERE Station_id=%s", (txn["Source_station"],))
        src = cursor.fetchone()
        cursor.execute("SELECT Station_name FROM Station WHERE Station_id=%s", (data["station_id"],))
        dst = cursor.fetchone()

        fare = 10  # fallback
        if src and dst:
            route = route_manager.get_route(src["Station_name"], dst["Station_name"])
            fare = route.get("estimated_fare", 10)

        # Check balance
        cursor.execute("SELECT Current_balance FROM Wallet WHERE User_id=%s", (user_id,))
        wallet = cursor.fetchone()
        if not wallet or float(wallet["Current_balance"]) < fare:
            return jsonify({"error": f"Insufficient balance. Required: ₹{fare}"}), 402

        # Deduct fare & close transaction
        cursor.execute("UPDATE Wallet SET Current_balance = Current_balance - %s WHERE User_id=%s", (fare, user_id))
        cursor.execute(
            "UPDATE Transactions SET Destination_station=%s, Fare_amount=%s WHERE Transaction_id=%s",
            (data["station_id"], fare, txn["Transaction_id"])
        )
        conn.commit()
        return jsonify({
            "message": "Face recognised. Gate opened for exit. Fare deducted.",
            "user_id": user_id,
            "transaction_id": txn["Transaction_id"],
            "fare_deducted": fare
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
