# Smart Task Analyzer - Full Stack Project

This repository contains a complete full-stack implementation of a Smart Task Analyzer system with an intelligent priority algorithm.

## Project Structure

```
project/
├── task_analyzer/          # Django Backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── README.md          # Detailed backend documentation
│   ├── sample_tasks.json  # Sample data for testing
│   ├── task_analyzer/     # Django project settings
│   ├── tasks/             # Main Django app
│   │   ├── priority_algorithm.py  # Core priority scoring logic
│   │   ├── validators.py          # Input validation & edge cases
│   │   ├── views.py               # API endpoints
│   │   ├── urls.py
│   │   └── tests.py               # 9 unit tests
│   └── frontend/          # Frontend application
│       ├── index.html
│       ├── styles.css
│       └── script.js
```

## Quick Start

### 1. Backend Setup

```bash
cd task_analyzer
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs on `http://127.0.0.1:8000`

### 2. Frontend Setup

Open `task_analyzer/frontend/index.html` in a web browser, or serve it:

```bash
cd task_analyzer/frontend
python -m http.server 8080
```

Visit `http://localhost:8080`

### 3. Run Tests

```bash
cd task_analyzer
python manage.py test tasks
```

## Key Features

### Backend (Django + Python)
- RESTful API with 2 endpoints (`/api/tasks/analyze/`, `/api/tasks/suggest/`)
- Custom priority algorithm with 4 weighted components
- Comprehensive edge case handling (circular deps, invalid dates, etc.)
- 9 passing unit tests
- CORS enabled for frontend integration

### Frontend (HTML/CSS/JavaScript)
- Manual task entry form
- Bulk JSON import
- 4 sorting modes (Smart Balance, Fastest Wins, High Impact, Deadline Driven)
- Color-coded priority visualization
- Detailed score breakdown display
- Responsive design

## Priority Algorithm

The algorithm calculates a 0-10 priority score using:

```
Priority = (Urgency × 0.35) + (Importance × 0.30) + (Effort × 0.20) + (Dependencies × 0.15)
```

**Urgency**: Time-based scoring (overdue = 10, due today = 9.5, etc.)
**Importance**: User-defined 1-10 scale
**Effort**: Inverse of hours (quick wins scored higher)
**Dependencies**: How many tasks this blocks

See `task_analyzer/README.md` for detailed algorithm explanation.

## API Endpoints

### POST /api/tasks/analyze/
Analyzes and sorts tasks by priority

**Request:**
```json
{
  "tasks": [
    {
      "title": "Fix bug",
      "due_date": "2025-11-30",
      "estimated_hours": 3,
      "importance": 8,
      "dependencies": []
    }
  ]
}
```

**Response:**
```json
{
  "tasks": [...],  // with priority_score, explanation, etc.
  "count": 1
}
```

### POST /api/tasks/suggest/
Returns top 3 recommended tasks with reasoning

## Technologies

- **Backend**: Python 3.13, Django 5.2.8, Django REST Framework
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Testing**: Django Test Framework (9 tests)

## Edge Cases Handled

Missing fields (defaults applied)
Invalid date formats
Past due dates
Circular dependencies
Self-dependencies
Negative/zero hours
Out-of-range importance
Duplicate task titles

## Testing

All 9 unit tests pass:
- 3 Algorithm tests (urgency, importance, dependencies)
- 3 Validator tests (circular deps, self-deps, validation)
- 3 API tests (analyze, suggest, error handling)

## Documentation

Full documentation in `task_analyzer/README.md` includes:
- Algorithm explanation (300-500 words)
- Design decisions
- Time breakdown
- Future improvements
