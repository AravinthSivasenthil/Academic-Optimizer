from fastapi import APIRouter, HTTPException
from app.database import db

router = APIRouter(prefix="/api/gpa", tags=["gpa"])

# Standard US 4.0 scale
def pct_to_gpa(pct: float) -> float:
    if pct >= 93: return 4.0
    if pct >= 90: return 3.7
    if pct >= 87: return 3.3
    if pct >= 83: return 3.0
    if pct >= 80: return 2.7
    if pct >= 77: return 2.3
    if pct >= 73: return 2.0
    if pct >= 70: return 1.7
    if pct >= 67: return 1.3
    if pct >= 60: return 1.0
    return 0.0

def pct_to_letter(pct: float) -> str:
    thresholds = [
        (93, "A"), (90, "A-"), (87, "B+"), (83, "B"), (80, "B-"),
        (77, "C+"), (73, "C"), (70, "C-"), (67, "D+"), (60, "D"),
    ]
    for t, l in thresholds:
        if pct >= t:
            return l
    return "F"

async def course_stats(course_id: str):
    total_weight = 0.0
    graded_weight = 0.0
    earned = 0.0
    async for a in db.assessments.find({"course_id": course_id}):
        w = a.get("weight", 0)
        total_weight += w
        if a.get("score") is not None and a.get("max_score", 0) > 0:
            earned += (a["score"] / a["max_score"]) * w
            graded_weight += w
    current = (earned / graded_weight * 100) if graded_weight > 0 else None
    return {
        "current_pct": current,
        "earned": earned,
        "graded_weight": graded_weight,
        "total_weight": total_weight,
    }

@router.get("/summary")
async def gpa_summary():
    by_semester: dict[str, list[dict]] = {}
    async for c in db.courses.find():
        cid = str(c["_id"])
        s = await course_stats(cid)
        pct = s["current_pct"]
        entry = {
            "id": cid,
            "name": c["name"],
            "code": c.get("code"),
            "credits": c["credits"],
            "grade_pct": round(pct, 2) if pct is not None else None,
            "letter": pct_to_letter(pct) if pct is not None else None,
            "gpa_points": pct_to_gpa(pct) if pct is not None else None,
        }
        sem = c.get("semester", "Unassigned")
        by_semester.setdefault(sem, []).append(entry)

    semesters = []
    cum_credits = 0.0
    cum_points = 0.0
    for sem, courses in by_semester.items():
        credits = sum(c["credits"] for c in courses if c["gpa_points"] is not None)
        points = sum(c["credits"] * c["gpa_points"] for c in courses if c["gpa_points"] is not None)
        sem_gpa = (points / credits) if credits > 0 else None
        cum_credits += credits
        cum_points += points
        semesters.append({
            "semester": sem,
            "gpa": round(sem_gpa, 3) if sem_gpa is not None else None,
            "credits": credits,
            "courses": courses,
        })

    cumulative = (cum_points / cum_credits) if cum_credits > 0 else None
    return {
        "semesters": semesters,
        "cumulative_gpa": round(cumulative, 3) if cumulative is not None else None,
        "total_credits": cum_credits,
    }

@router.get("/whatif/{course_id}")
async def whatif(course_id: str, target: float):
    """Required avg on ungraded work to hit target course %."""
    s = await course_stats(course_id)
    total_weight = s["total_weight"]
    graded_weight = s["graded_weight"]
    earned = s["earned"]

    remaining_weight = total_weight - graded_weight
    if total_weight <= 0:
        raise HTTPException(400, "No assessments defined for this course")
    if remaining_weight <= 0:
        return {
            "achievable": False,
            "reason": "No ungraded work remaining",
            "required_avg": None,
            "target": target,
        }

    required_total_earned = target * total_weight / 100
    required_from_remaining = required_total_earned - earned
    required_avg_pct = (required_from_remaining / remaining_weight) * 100

    return {
        "target": target,
        "current_earned": round(earned, 2),
        "graded_weight": round(graded_weight, 2),
        "remaining_weight": round(remaining_weight, 2),
        "required_avg": round(required_avg_pct, 2),
        "achievable": 0 <= required_avg_pct <= 100,
    }
