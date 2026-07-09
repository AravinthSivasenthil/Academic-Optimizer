from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
from app.database import db

router = APIRouter(prefix="/api/assessments", tags=["assessments"])

class AssessmentIn(BaseModel):
    course_id: str
    name: str
    type: str = "assignment"  # assignment | quiz | midterm | final | project
    weight: float             # % of course grade
    max_score: float = 100
    score: Optional[float] = None  # None = not graded yet

def to_out(a: dict) -> dict:
    a["id"] = str(a["_id"])
    del a["_id"]
    return a

@router.get("")
async def list_assessments(course_id: Optional[str] = None):
    q = {"course_id": course_id} if course_id else {}
    results = []
    async for a in db.assessments.find(q).sort("created_at", 1):
        results.append(to_out(a))
    return results

@router.post("")
async def create_assessment(payload: AssessmentIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.assessments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_out(doc)

@router.put("/{assessment_id}")
async def update_assessment(assessment_id: str, payload: AssessmentIn):
    result = await db.assessments.update_one(
        {"_id": ObjectId(assessment_id)},
        {"$set": payload.model_dump()},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Assessment not found")
    doc = await db.assessments.find_one({"_id": ObjectId(assessment_id)})
    return to_out(doc)

@router.delete("/{assessment_id}")
async def delete_assessment(assessment_id: str):
    result = await db.assessments.delete_one({"_id": ObjectId(assessment_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Assessment not found")
    return {"ok": True}

@router.get("/course/{course_id}/summary")
async def course_summary(course_id: str):
    """Weighted grade so far for a course."""
    total_weight = 0.0
    graded_weight = 0.0
    earned = 0.0  # sum of (score/max) * weight

    async for a in db.assessments.find({"course_id": course_id}):
        w = a.get("weight", 0)
        total_weight += w
        if a.get("score") is not None and a.get("max_score", 0) > 0:
            earned += (a["score"] / a["max_score"]) * w
            graded_weight += w

    current_grade = (earned / graded_weight * 100) if graded_weight > 0 else None
    return {
        "total_weight": round(total_weight, 2),
        "graded_weight": round(graded_weight, 2),
        "current_grade": round(current_grade, 2) if current_grade is not None else None,
        "points_earned": round(earned, 2),
    }