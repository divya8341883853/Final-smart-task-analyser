# Smart Task Analyzer

An intelligent task prioritization system that uses a custom algorithm to analyze and rank tasks based on urgency, importance, effort, and dependencies.

## How to Run the Project

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run database migrations:
```bash
python manage.py migrate
```

3. Start the Django development server:
```bash
python manage.py runserver
```

The backend API will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. Open the `frontend/index.html` file in a web browser
2. Or serve it using a simple HTTP server:
```bash
cd frontend
python -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

### Running Tests

Run the unit tests with:
```bash
python manage.py test tasks
```

## Priority Algorithm Explanation

The Smart Task Analyzer uses a weighted scoring system that evaluates four critical dimensions of task management to calculate a priority score from 0-10 for each task.

### Algorithm Formula

```
Priority Score = (Urgency × 0.35) + (Importance × 0.30) + (Effort × 0.20) + (Dependencies × 0.15)
```

### Component Breakdown

**1. Urgency Score (35% weight)**

Urgency is calculated based on how soon the task is due. The algorithm considers:
- Overdue tasks receive the maximum score of 10.0
- Due today: 9.5
- Due within 1 day: 9.0
- Due within 3 days: 8.0
- Due within 1 week: 6.5
- Due within 2 weeks: 5.0
- Due within 1 month: 3.5
- More than 1 month away: 2.0

This time-based urgency ensures that tasks approaching their deadlines naturally rise to the top, preventing last-minute rushes and missed deadlines.

**2. Importance Score (30% weight)**

User-defined importance rating (1-10 scale) is normalized and weighted. This allows users to explicitly mark high-priority tasks that might not be urgent but are crucial to long-term goals. The algorithm validates and clamps importance values to ensure they stay within the valid range.

**3. Effort Score (20% weight)**

The effort score inversely correlates with estimated hours, rewarding "quick wins":
- 1 hour or less: 9.0
- 1-2 hours: 8.0
- 2-4 hours: 6.5
- 4-8 hours: 5.0
- 8-16 hours: 3.5
- More than 16 hours: 2.0

This encourages completing smaller tasks that can provide momentum and a sense of accomplishment, while still accounting for larger strategic initiatives.

**4. Dependency Score (15% weight)**

Tasks that block other tasks receive higher scores:
- Blocks 3+ tasks: 10.0
- Blocks 2 tasks: 8.0
- Blocks 1 task: 6.0
- Blocks nothing: 5.0

This prevents bottlenecks by prioritizing foundational work that enables other tasks to proceed.

### Why This Algorithm Works

The algorithm balances multiple competing priorities that real-world task management demands:

1. **Time Sensitivity**: The high urgency weight (35%) ensures deadlines are never ignored
2. **Strategic Importance**: The importance weight (30%) keeps long-term goals visible
3. **Momentum Building**: The effort score (20%) promotes quick wins that maintain productivity
4. **Dependency Management**: The dependency weight (15%) prevents workflow bottlenecks

The weights were chosen through analysis of common productivity frameworks (Eisenhower Matrix, Getting Things Done) and adjusted to prioritize deadline adherence while maintaining flexibility for strategic work.

## Design Decisions

### Backend Architecture

- **Django REST Framework**: Chosen for rapid API development with built-in serialization and validation
- **Separation of Concerns**: Split into three modules:
  - `priority_algorithm.py`: Core scoring logic, isolated for testing and reusability
  - `validators.py`: Input validation and edge case handling
  - `views.py`: API endpoints that orchestrate the components
- **Stateless Design**: No database required; all analysis happens in-memory for simplicity and speed

### Edge Case Handling

The system handles multiple edge cases:
- **Missing fields**: Defaults are applied (importance=5, estimated_hours=1)
- **Invalid dates**: Cleaned and validated, invalid dates are reset
- **Past due dates**: Handled gracefully with maximum urgency
- **Circular dependencies**: Detected using depth-first search algorithm
- **Self-dependencies**: Explicitly validated and rejected
- **Negative/zero hours**: Clamped to minimum of 1 hour
- **Importance out of range**: Clamped to 1-10 range
- **Duplicate task titles**: Rejected to maintain uniqueness

### Frontend Features

- **Dual Input Mode**: Manual form entry or bulk JSON import for flexibility
- **Four Sorting Modes**:
  - Smart Balance: Uses the custom algorithm
  - Fastest Wins: Sort by estimated hours
  - High Impact: Sort by importance
  - Deadline Driven: Sort by due date
- **Visual Feedback**: Color-coded priority levels (High/Medium/Low)
- **Detailed Breakdown**: Shows individual component scores for transparency
- **Responsive Design**: Works on mobile and desktop

## Time Spent

- Algorithm design and research: 2 hours
- Backend implementation: 3 hours
- Frontend development: 2.5 hours
- Testing and edge cases: 1.5 hours
- Documentation: 1 hour
- **Total: ~10 hours**

## Bonus Features

None implemented (focused on core functionality and robustness).

## Future Improvements

1. **Machine Learning Integration**: Learn from user behavior to adjust weights dynamically
2. **Calendar Integration**: Sync with Google Calendar/Outlook for automatic deadline tracking
3. **Collaborative Features**: Team-based task assignment and dependency management
4. **Time Blocking**: Suggest optimal time slots based on estimated hours and calendar availability
5. **Historical Analytics**: Track completion patterns and improve time estimates
6. **Eisenhower Matrix Visualization**: 2D grid view of urgency vs importance
7. **Dependency Graph**: Visual representation of task relationships
8. **Weekend/Holiday Handling**: Skip non-working days in urgency calculations
9. **Recurring Tasks**: Support for repeating tasks with different priorities
10. **Mobile App**: Native iOS/Android applications for on-the-go task management

## API Endpoints

### POST /api/tasks/analyze/

Analyzes a list of tasks and returns them sorted by priority score.

**Request Body:**
```json
{
  "tasks": [
    {
      "title": "Fix login bug",
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
  "tasks": [
    {
      "title": "Fix login bug",
      "due_date": "2025-11-30",
      "estimated_hours": 3,
      "importance": 8,
      "dependencies": [],
      "priority_score": 8.45,
      "priority_level": "High",
      "urgency_score": 9.0,
      "importance_score": 8.0,
      "effort_score": 6.5,
      "dependency_score": 5.0,
      "explanation": "High urgency - Due within days. High importance. Moderate effort required."
    }
  ],
  "count": 1
}
```

### POST /api/tasks/suggest/

Returns the top 3 recommended tasks for today with detailed reasoning.

**Request Body:** Same as analyze endpoint

**Response:**
```json
{
  "suggestions": [
    {
      "rank": 1,
      "task": { /* full task object with scores */ },
      "reason": "Priority Score: 8.45/10. This task is due very soon and It's highly important to your goals and It's a quick win that won't take much time."
    }
  ],
  "message": "Here are your top 3 recommended tasks for today"
}
```

## Testing

The project includes 9 comprehensive unit tests covering:

1. **Algorithm Tests**:
   - Urgency calculation for overdue tasks
   - Importance normalization (clamping out-of-range values)
   - Dependency score calculation

2. **Validator Tests**:
   - Circular dependency detection
   - Self-dependency detection
   - Valid task validation

3. **API Tests**:
   - Analyze endpoint functionality
   - Suggest endpoint functionality
   - Error handling for empty task lists

All tests can be run with: `python manage.py test tasks`

## Technologies Used

- **Backend**: Python 3.13, Django 5.2.8, Django REST Framework 3.16.1
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with gradient themes and responsive design
- **API**: RESTful JSON API with CORS support

## Project Structure

```
task_analyzer/
├── manage.py
├── requirements.txt
├── README.md
├── task_analyzer/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── tasks/
│   ├── priority_algorithm.py
│   ├── validators.py
│   ├── views.py
│   ├── urls.py
│   └── tests.py
└── frontend/
    ├── index.html
    ├── styles.css
    └── script.js
```
