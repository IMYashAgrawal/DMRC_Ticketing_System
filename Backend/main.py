from flask import Flask, jsonify
from flask_cors import CORS

from Module_1_User_Management.router import module1
from Module_2_Route_Navigator.router import module2
from Module_3_Face_Auth.router import module3
from Module_4_Wallet_Engine.router import module4

app = Flask(__name__)
CORS(app)  # Allow all origins (restrict in production)

# Register Blueprints
app.register_blueprint(module1, url_prefix="/api/v1/auth")
app.register_blueprint(module2, url_prefix="/api/v1/route")
app.register_blueprint(module3, url_prefix="/api/v1/gate")
app.register_blueprint(module4, url_prefix="/api/v1/wallet")

@app.get("/")
def index():
    return jsonify({"status": "ok", "message": "DMRC Smart Ticketing Backend is running!"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
