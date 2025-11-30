const API_BASE_URL = 'http://127.0.0.1:8000/api/tasks';

let tasks = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('task-form').addEventListener('submit', handleAddTask);
    document.getElementById('load-json-btn').addEventListener('click', handleLoadJSON);
    document.getElementById('analyze-btn').addEventListener('click', handleAnalyze);
    document.getElementById('suggest-btn').addEventListener('click', handleSuggest);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('due_date').setAttribute('min', today);
}

function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

function handleAddTask(e) {
    e.preventDefault();

    const task = {
        title: document.getElementById('title').value.trim(),
        due_date: document.getElementById('due_date').value,
        estimated_hours: parseFloat(document.getElementById('estimated_hours').value),
        importance: parseInt(document.getElementById('importance').value),
        dependencies: document.getElementById('dependencies').value
            .split(',')
            .map(d => d.trim())
            .filter(d => d.length > 0)
    };

    if (tasks.some(t => t.title === task.title)) {
        showError('A task with this title already exists!');
        return;
    }

    tasks.push(task);
    updateTaskList();
    e.target.reset();
    hideError();
}

function handleLoadJSON() {
    const jsonInput = document.getElementById('json-input').value.trim();

    if (!jsonInput) {
        showError('Please paste JSON data first');
        return;
    }

    try {
        const parsedTasks = JSON.parse(jsonInput);

        if (!Array.isArray(parsedTasks)) {
            showError('JSON must be an array of tasks');
            return;
        }

        tasks = parsedTasks;
        updateTaskList();
        switchTab('manual');
        hideError();
        showSuccess('Tasks loaded successfully!');
    } catch (e) {
        showError('Invalid JSON format: ' + e.message);
    }
}

function updateTaskList() {
    const container = document.getElementById('current-tasks');

    if (tasks.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No tasks added yet</p>';
        return;
    }

    container.innerHTML = tasks.map((task, index) => `
        <div class="task-item">
            <div class="task-item-info">
                <div class="task-item-title">${task.title}</div>
                <div class="task-item-details">
                    Due: ${task.due_date} | Hours: ${task.estimated_hours} | Importance: ${task.importance}/10
                    ${task.dependencies.length > 0 ? ` | Depends on: ${task.dependencies.join(', ')}` : ''}
                </div>
            </div>
            <button class="task-item-remove" onclick="removeTask(${index})">Remove</button>
        </div>
    `).join('');
}

function removeTask(index) {
    tasks.splice(index, 1);
    updateTaskList();
}

async function handleAnalyze() {
    if (tasks.length === 0) {
        showError('Please add tasks first');
        return;
    }

    const sortMode = document.getElementById('sort-mode').value;

    try {
        const response = await fetch(`${API_BASE_URL}/analyze/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tasks })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Analysis failed');
            return;
        }

        let sortedTasks = data.tasks;

        switch (sortMode) {
            case 'effort':
                sortedTasks = sortedTasks.sort((a, b) => a.estimated_hours - b.estimated_hours);
                break;
            case 'importance':
                sortedTasks = sortedTasks.sort((a, b) => b.importance - a.importance);
                break;
            case 'deadline':
                sortedTasks = sortedTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                break;
        }

        displayResults(sortedTasks, sortMode);
        hideError();
        document.getElementById('suggestions-section').classList.add('hidden');
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

async function handleSuggest() {
    if (tasks.length === 0) {
        showError('Please add tasks first');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/suggest/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tasks })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Suggestion failed');
            return;
        }

        displaySuggestions(data.suggestions);
        hideError();
        document.getElementById('results-section').classList.add('hidden');
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

function displayResults(tasks, sortMode) {
    const container = document.getElementById('results-container');
    const section = document.getElementById('results-section');

    const modeText = {
        smart: 'Smart Balance (AI Algorithm)',
        effort: 'Fastest Wins (Low Effort First)',
        importance: 'High Impact (Most Important First)',
        deadline: 'Deadline Driven (Earliest Due Date First)'
    };

    container.innerHTML = `
        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3498db;">
            <strong>Sorting Mode:</strong> ${modeText[sortMode]}
        </div>
        ${tasks.map((task, index) => createTaskCard(task, index + 1)).join('')}
    `;

    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createTaskCard(task, rank) {
    return `
        <div class="task-card priority-${task.priority_level.toLowerCase()}">
            <div class="task-card-header">
                <div class="task-card-title">#${rank} ${task.title}</div>
                <span class="priority-badge priority-${task.priority_level.toLowerCase()}">${task.priority_level}</span>
            </div>

            <div class="task-card-score">
                Priority Score: ${task.priority_score}/10
            </div>

            <div class="task-card-details">
                <div class="detail-item">
                    <span class="detail-label">Due Date</span>
                    <span class="detail-value">${task.due_date}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Estimated Hours</span>
                    <span class="detail-value">${task.estimated_hours}h</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Importance</span>
                    <span class="detail-value">${task.importance}/10</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Dependencies</span>
                    <span class="detail-value">${task.dependencies.length > 0 ? task.dependencies.length : 'None'}</span>
                </div>
            </div>

            <div class="task-card-breakdown">
                <div class="breakdown-item">
                    <div class="breakdown-label">Urgency</div>
                    <div class="breakdown-value">${task.urgency_score}</div>
                </div>
                <div class="breakdown-item">
                    <div class="breakdown-label">Importance</div>
                    <div class="breakdown-value">${task.importance_score}</div>
                </div>
                <div class="breakdown-item">
                    <div class="breakdown-label">Effort</div>
                    <div class="breakdown-value">${task.effort_score}</div>
                </div>
                <div class="breakdown-item">
                    <div class="breakdown-label">Dependency</div>
                    <div class="breakdown-value">${task.dependency_score}</div>
                </div>
            </div>

            <div class="task-card-explanation">
                <strong>Analysis:</strong> ${task.explanation}
            </div>

            ${task.dependencies.length > 0 ? `
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <strong>Blocks:</strong> ${task.dependencies.join(', ')}
                </div>
            ` : ''}
        </div>
    `;
}

function displaySuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');
    const section = document.getElementById('suggestions-section');

    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-card">
            <div class="suggestion-rank">${suggestion.rank}</div>

            ${createTaskCard(suggestion.task, suggestion.rank)}

            <div class="suggestion-reason">
                <strong>Why this task?</strong><br>
                ${suggestion.reason}
            </div>
        </div>
    `).join('');

    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.background = '#d4edda';
    errorDiv.style.color = '#155724';
    errorDiv.style.borderLeftColor = '#28a745';
    errorDiv.classList.remove('hidden');

    setTimeout(() => {
        errorDiv.classList.add('hidden');
        errorDiv.style.background = '#fee';
        errorDiv.style.color = '#c33';
        errorDiv.style.borderLeftColor = '#c33';
    }, 3000);
}
