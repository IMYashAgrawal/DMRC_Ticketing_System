from flask import Blueprint, request, jsonify
from db import get_connection

module4 = Blueprint("module4", __name__)

# ---------------------------------------------------------------------------
# GET /api/v1/wallet/balance/<user_id>
# ---------------------------------------------------------------------------
@module4.get("/balance/<int:user_id>")
def get_balance(user_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT Current_balance FROM Wallet WHERE User_id=%s", (user_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Wallet not found for this user."}), 404
        return jsonify({"user_id": user_id, "balance": float(row["Current_balance"])})
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/v1/wallet/topup
# ---------------------------------------------------------------------------
@module4.post("/topup")
def topup_wallet():
    data = request.get_json()
    if not data or "user_id" not in data or "amount" not in data:
        return jsonify({"error": "user_id and amount are required."}), 400

    amount = float(data["amount"])
    if amount <= 0:
        return jsonify({"error": "Top-up amount must be greater than zero."}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT Current_balance FROM Wallet WHERE User_id=%s", (data["user_id"],))
        wallet = cursor.fetchone()
        if not wallet:
            return jsonify({"error": "Wallet not found."}), 404

        cursor.execute(
            "UPDATE Wallet SET Current_balance = Current_balance + %s WHERE User_id=%s",
            (amount, data["user_id"])
        )
        conn.commit()
        return jsonify({
            "message": f"₹{amount} added to wallet successfully.",
            "user_id": data["user_id"],
            "new_balance": float(wallet["Current_balance"]) + amount
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# GET /api/v1/wallet/transactions/<user_id>
# ---------------------------------------------------------------------------
@module4.get("/transactions/<int:user_id>")
def get_transactions(user_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT t.Transaction_id,
                      s.Station_name AS Source,
                      d.Station_name AS Destination,
                      t.Fare_amount,
                      t.Transaction_date
               FROM Transactions t
               JOIN   Station s ON t.Source_station      = s.Station_id
               LEFT JOIN Station d ON t.Destination_station = d.Station_id
               WHERE t.User_id = %s
               ORDER BY t.Transaction_date DESC""",
            (user_id,)
        )
        rows = cursor.fetchall()
        for row in rows:
            row["Transaction_date"] = str(row["Transaction_date"])
            if row["Fare_amount"] is not None:
                row["Fare_amount"] = float(row["Fare_amount"])
        return jsonify({"user_id": user_id, "transactions": rows})
    finally:
        cursor.close()
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/v1/wallet/buy-ticket
# ---------------------------------------------------------------------------
@module4.post("/buy-ticket")
def buy_ticket():
    data = request.get_json()
    if not data or "user_id" not in data or "source" not in data or "destination" not in data or "fare" not in data:
        return jsonify({"error": "user_id, source, destination, and fare are required."}), 400

    user_id = data["user_id"]
    fare = float(data["fare"])

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Get source and destination station IDs
        cursor.execute("SELECT Station_id FROM Station WHERE Station_name = %s", (data["source"],))
        src_row = cursor.fetchone()
        cursor.execute("SELECT Station_id FROM Station WHERE Station_name = %s", (data["destination"],))
        dst_row = cursor.fetchone()

        if not src_row or not dst_row:
            return jsonify({"error": "Invalid source or destination station name."}), 400
        
        src_id = src_row["Station_id"]
        dst_id = dst_row["Station_id"]

        # Check balance
        cursor.execute("SELECT Current_balance FROM Wallet WHERE User_id=%s", (user_id,))
        wallet = cursor.fetchone()
        if not wallet or float(wallet["Current_balance"]) < fare:
            return jsonify({"error": f"Insufficient wallet balance. Required: ₹{fare}"}), 402

        # Deduct from wallet
        cursor.execute(
            "UPDATE Wallet SET Current_balance = Current_balance - %s WHERE User_id=%s",
            (fare, user_id)
        )

        # Create full transaction
        cursor.execute(
            "INSERT INTO Transactions (User_id, Source_station, Destination_station, Fare_amount) VALUES (%s, %s, %s, %s)",
            (user_id, src_id, dst_id, fare)
        )
        conn.commit()

        return jsonify({
            "message": "Ticket purchased successfully.",
            "transaction_id": cursor.lastrowid
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
