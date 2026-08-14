from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
from app.database import db

router = APIRouter(prefix="/api/deadlines", tags=["deadlines"])

class DeadlineIn(BaseModel):
    title: str
    course_id: Optional[str] = None
    due_date: datetime
    notes: Optional[str] = None
    completed: bool = False

def to_out(d: dict) -> dict:
    d["id"] = str(d["_id"])
    del d["_id"]
    return d

@router.get("")
async def list_deadlines():
    results = []
    async for d in db.deadlines.find().sort("due_date", 1):
        results.append(to_out(d))
    return results

@router.post("")
async def create_deadline(payload: DeadlineIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.deadlines.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_out(doc)

@router.put("/{deadline_id}")
async def update_deadline(deadline_id: str, payload: DeadlineIn):
    result = await db.deadlines.update_one(
        {"_id": ObjectId(deadline_id)},
        {"$set": payload.model_dump()},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Deadline not found")
    doc = await db.deadlines.find_one({"_id": ObjectId(deadline_id)})
    return to_out(doc)

@router.patch("/{deadline_id}/toggle")
async def toggle_completed(deadline_id: str):
    doc = await db.deadlines.find_one({"_id": ObjectId(deadline_id)})
    if not doc:
        raise HTTPException(404, "Deadline not found")
    new_status = not doc.get("completed", False)
    await db.deadlines.update_one(
        {"_id": ObjectId(deadline_id)},
        {"$set": {"completed": new_status}},
    )
    doc["completed"] = new_status
    return to_out(doc)

@router.delete("/{deadline_id}")
async def delete_deadline(deadline_id: str):
    result = await db.deadlines.delete_one({"_id": ObjectId(deadline_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Deadline not found")
    return {"ok": True}
