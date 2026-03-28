from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Module_1_User_Management.router import router as module1_router
from Module_2_Route_Navigator.router import router as module2_router
from Module_3_Face_Gate_Authentication.router import router as module3_router
from Module_4_Wallet_Engine.router import router as module4_router

app = FastAPI(
    title="DMRC Smart Ticketing System API",
    description="Backend API combining MFAS and Smart Metro Navigator capabilities",
    version="1.0.0"
)

# Configure CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Expand to precise frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Module Routers
app.include_router(module1_router, prefix="/api/v1/auth", tags=["User Management & Bio-Enrollment"])
app.include_router(module2_router, prefix="/api/v1/route", tags=["Route Navigator"])
app.include_router(module3_router, prefix="/api/v1/gate", tags=["Face-Gate Authentication"])
app.include_router(module4_router, prefix="/api/v1/wallet", tags=["Wallet Engine"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "DMRC Smart Ticketing Backend is running!"}
