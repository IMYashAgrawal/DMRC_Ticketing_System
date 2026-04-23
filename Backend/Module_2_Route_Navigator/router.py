from flask import Blueprint, request, jsonify
from Module_2_Route_Navigator.route_manager import route_manager

module2 = Blueprint("module2", __name__)

# ---------------------------------------------------------------------------
# GET /api/v1/route/calculate?source=Rajiv+Chowk&destination=Hauz+Khas
# ---------------------------------------------------------------------------
@module2.get("/calculate")
def calculate_route():
    source = request.args.get("source", "").strip()
    destination = request.args.get("destination", "").strip()

    if not source or not destination:
        return jsonify({"error": "Both 'source' and 'destination' query parameters are required."}), 400

    result = route_manager.get_route(source, destination)
    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)
