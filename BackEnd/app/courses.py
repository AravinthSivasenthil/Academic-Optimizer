from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
from app.database import db

router = APIRouter(prefix="/api/courses", tags=["courses"])

class CourseIn(BaseModel):
    name: str
    code: Optional[str] = None
    credits: float
    instructor: Optional[str] = None
    semester: str
    category: str = "core"  # core | major | elective

def to_out(c: dict) -> dict:
    c["id"] = str(c["_id"])
    del c["_id"]
    return c

@router.get("")
async def list_courses():
    courses = []
    async for c in db.courses.find().sort("created_at", -1):
        courses.append(to_out(c))
    return courses

@router.post("")
async def create_course(payload: CourseIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.courses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_out(doc)

@router.put("/{course_id}")
async def update_course(course_id: str, payload: CourseIn):
    result = await db.courses.update_one(
        {"_id": ObjectId(course_id)},
        {"$set": payload.model_dump()},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Course not found")
    doc = await db.courses.find_one({"_id": ObjectId(course_id)})
    return to_out(doc)

@router.delete("/{course_id}")
async def delete_course(course_id: str):
    result = await db.courses.delete_one({"_id": ObjectId(course_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Course not found")
    return {"ok": True}