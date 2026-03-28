from fastapi import APIRouter

router = APIRouter()

@router.post("/scan-entry")
def scan_entry():
    return {"message": "Face recognized. Gate opened for entry."}

@router.post("/scan-exit")
def scan_exit():
    return {"message": "Face recognized. Gate opened for exit. Fare deducted."}
