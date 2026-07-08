from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db
from app import courses

app = FastAPI(title="Academic Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(courses.router)

@app.get("/")
async def root():
    return {"message": "Academic Optimizer API is running"}

@app.get("/api/health")
async def health():
    try:
        await db.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}