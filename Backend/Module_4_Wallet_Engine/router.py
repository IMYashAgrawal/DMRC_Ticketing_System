from fastapi import APIRouter

router = APIRouter()

@router.get("/balance/{user_id}")
def get_balance(user_id: int):
    return {"user_id": user_id, "balance": 0.0}

@router.post("/topup")
def topup_wallet():
    return {"message": "Wallet topped up successfully"}
