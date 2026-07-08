# Academic Optimizer
A full-stack productivity application designed to help students track and optimize academic schedules.

## Architecture
- **Backend**: FastAPI (Python) serving a RESTful API.
- **Frontend**: React (TypeScript) with Vite, styled using Tailwind CSS.
- **Database**: MongoDB.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB

### Running the Backend
1. `cd academic-optimizer/BackEnd`
2. `source venv/Scripts/activate`  # Windows
3. `pip install -r requirements.txt`
4. `uvicorn app.main:app --reload`

### Running the Frontend
1. `cd academic-optimizer/FrontEnd`
2. `npm install`
3. `npm run dev`