from flask import Blueprint, request, jsonify
import bcrypt
import json

from db import get_connection
from Module_1_User_Management.biometric_service import biometric_service

module1 = Blueprint("module1", __name__)

# ---------------------------------------------------------------------------
# POST /api/v1/auth/register
# ---------------------------------------------------------------------------
@module1.post("/register")
def register_user():
    data = request.get_json()
    required = ["first_name", "last_name", "email", "phone_no", "password", "face_image_b64"]
    if not all(k in data for k in required):
        return jsonify({"error": f"Missing fields. Required: {required}"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        hashed_pw = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()

        cursor.execute(
            "INSERT INTO Users (First_name, Last_name, Email, Phone_no, Password_hash) VALUES (%s,%s,%s,%s,%s)",
            (data["first_name"], data["last_name"], data["email"], data["phone_no"], hashed_pw)
        )
        user_id = cursor.lastrowid

        cursor.execute("INSERT INTO Wallet (User_id, Current_balance) VALUES (%s, 0.00)", (user_id,))

        embedding = biometric_service.get_embedding(data["face_image_b64"])
        if embedding is None:
            conn.rollback()
            return jsonify({"error": "Could not extract face embedding. Please use a clear face photo."}), 400

        cursor.execute(
            "INSERT INTO Biometric_Detail (User_id, Biometric_data) VALUES (%s, %s)",
            (user_id, json.dumps(embedding))
        )
        conn.commit()
        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201

    except Exception as e:
        conn.rollback()
        if "Duplicate entry" in str(e):
            return jsonify({"error": "Email or phone number already registered."}), 409
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login
# ---------------------------------------------------------------------------
@module1.post("/login")
def login_user():
    data = request.get_json()
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "email and password are required."}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT User_id, Password_hash, First_name FROM Users WHERE Email = %s", (data["email"],))
        user = cursor.fetchone()
        if not user or not bcrypt.checkpw(data["password"].encode(), user["Password_hash"].encode()):
            return jsonify({"error": "Invalid email or password."}), 401

        return jsonify({
            "message": "Password verified. Proceed to face verification.",
            "user_id": user["User_id"],
            "first_name": user["First_name"]
        })
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/v1/auth/verify-face
# ---------------------------------------------------------------------------
@module1.post("/verify-face")
def verify_face():
    data = request.get_json()
    if not data or "user_id" not in data or "face_image_b64" not in data:
        return jsonify({"error": "user_id and face_image_b64 are required."}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT Biometric_data FROM Biometric_Detail WHERE User_id = %s", (data["user_id"],))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "No biometric data registered for this user."}), 404

        stored_embedding = json.loads(row["Biometric_data"])
        match = biometric_service.verify_embedding(stored_embedding, data["face_image_b64"])
        if not match:
            return jsonify({"error": "Face verification failed."}), 401

        return jsonify({"message": "Face verified successfully. Login complete.", "user_id": data["user_id"]})
    finally:
        cursor.close()
        conn.close()
