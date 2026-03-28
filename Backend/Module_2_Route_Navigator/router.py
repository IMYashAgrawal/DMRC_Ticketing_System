from fastapi import APIRouter
from .route_manager import route_manager

router = APIRouter()

@router.get("/calculate")
def calculate_route(source: str, destination: str):
    result = route_manager.get_route(source, destination)
    if result and "error" in result:
        return {"error": result["error"]}
    return result
