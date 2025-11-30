import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/tasks';

interface Task {
  title: string;
  due_date: string;
  estimated_hours: number;
  importance: number;
  dependencies: string[];
  priority_score?: number;
  priority_level?: string;
  explanation?: string;
  urgency_score?: number;
  importance_score?: number;
  effort_score?: number;
  dependency_score?: number;
}

interface Suggestion {
  rank: number;
  task: Task;
  reason: string;
}

type SortMode = 'smart' | 'effort' | 'importance' | 'deadline';
type TabType = 'manual' | 'json';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [sortMode, setSortMode] = useState<SortMode>('smart');
  const [analyzedTasks, setAnalyzedTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    estimated_hours: '',
    importance: '',
    dependencies: '',
  });

  const [jsonInput, setJsonInput] = useState('');

  const showError = (message: string) => {
    setError(message);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (tasks.some(t => t.title === formData.title.trim())) {
      showError('A task with this title already exists!');
      return;
    }

    const newTask: Task = {
      title: formData.title.trim(),
      due_date: formData.due_date,
      estimated_hours: parseFloat(formData.estimated_hours),
      importance: parseInt(formData.importance),
      dependencies: formData.dependencies
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0),
    };

    setTasks([...tasks, newTask]);
    setFormData({
      title: '',
      due_date: '',
      estimated_hours: '',
      importance: '',
      dependencies: '',
    });
    showSuccess('Task added successfully!');
  };

  const handleLoadJSON = () => {
    if (!jsonInput.trim()) {
      showError('Please paste JSON data first');
      return;
    }

    try {
      const parsedTasks = JSON.parse(jsonInput);
      if (!Array.isArray(parsedTasks)) {
        showError('JSON must be an array of tasks');
        return;
      }
      setTasks(parsedTasks);
      setActiveTab('manual');
      showSuccess('Tasks loaded successfully!');
    } catch (e) {
      showError(`Invalid JSON format: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (tasks.length === 0) {
      showError('Please add tasks first');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Analysis failed');
        return;
      }

      let sortedTasks = [...data.tasks];

      switch (sortMode) {
        case 'effort':
          sortedTasks.sort((a, b) => a.estimated_hours - b.estimated_hours);
          break;
        case 'importance':
          sortedTasks.sort((a, b) => b.importance - a.importance);
          break;
        case 'deadline':
          sortedTasks.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
          break;
      }

      setAnalyzedTasks(sortedTasks);
      showSuccess('Tasks analyzed successfully!');
    } catch (error) {
      showError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (tasks.length === 0) {
      showError('Please add tasks first');
      return;
    }

    setLoading(true);
    setError('');
    setAnalyzedTasks([]);

    try {
      const response = await fetch(`${API_BASE_URL}/suggest/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Suggestion failed');
        return;
      }

      setSuggestions(data.suggestions);
      showSuccess('Top 3 suggestions generated!');
    } catch (error) {
      showError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const modeText: Record<SortMode, string> = {
    smart: 'Smart Balance (AI Algorithm)',
    effort: 'Fastest Wins (Low Effort First)',
    importance: 'High Impact (Most Important First)',
    deadline: 'Deadline Driven (Earliest Due Date First)',
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Smart Task Analyzer</h1>
          <p className="text-gray-600">Intelligently prioritize your tasks using AI-driven algorithms</p>
        </header>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
            {success}
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Tasks</h2>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-2 font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-6 py-2 font-medium transition-colors ${
                activeTab === 'json'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              JSON Bulk Input
            </button>
          </div>

          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <div>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Fix login bug"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Hours *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.5"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      placeholder="e.g., 3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importance (1-10) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.importance}
                      onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                      placeholder="e.g., 8"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dependencies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.dependencies}
                      onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                      placeholder="e.g., Setup API, Create database"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Task
                </button>
              </form>

              {/* Current Tasks List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Tasks ({tasks.length})</h3>
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tasks added yet</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{task.title}</div>
                          <div className="text-sm text-gray-600">
                            Due: {task.due_date} | Hours: {task.estimated_hours} | Importance: {task.importance}/10
                            {task.dependencies.length > 0 && ` | Depends on: ${task.dependencies.join(', ')}`}
                          </div>
                        </div>
                        <button
                          onClick={() => removeTask(index)}
                          className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* JSON Input Tab */}
          {activeTab === 'json' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste JSON Array of Tasks
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={15}
                  placeholder={`[\n  {\n    "title": "Fix login bug",\n    "due_date": "2025-11-30",\n    "estimated_hours": 3,\n    "importance": 8,\n    "dependencies": []\n  },\n  {\n    "title": "Write documentation",\n    "due_date": "2025-12-05",\n    "estimated_hours": 2,\n    "importance": 6,\n    "dependencies": ["Fix login bug"]\n  }\n]`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              <button
                onClick={handleLoadJSON}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Load Tasks from JSON
              </button>
            </div>
          )}

          {/* Analysis Controls */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sorting Mode
                  </label>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="smart">Smart Balance (AI Algorithm)</option>
                    <option value="effort">Fastest Wins (Low Effort)</option>
                    <option value="importance">High Impact (Importance)</option>
                    <option value="deadline">Deadline Driven (Due Date)</option>
                  </select>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'Analyze Tasks'}
                </button>
                <button
                  onClick={handleSuggest}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Get Top 3 Suggestions'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {analyzedTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analysis Results</h2>
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <strong>Sorting Mode:</strong> {modeText[sortMode]}
            </div>
            <div className="space-y-4">
              {analyzedTasks.map((task, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 ${getPriorityColor(task.priority_level)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-xl font-bold mb-1">
                        #{index + 1} {task.title}
                      </div>
                      <div className="text-sm font-semibold">
                        Priority Score: {task.priority_score}/10
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(task.priority_level)}`}>
                      {task.priority_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-600">Due Date</div>
                      <div className="font-medium">{task.due_date}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Estimated Hours</div>
                      <div className="font-medium">{task.estimated_hours}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Importance</div>
                      <div className="font-medium">{task.importance}/10</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Dependencies</div>
                      <div className="font-medium">
                        {task.dependencies.length > 0 ? task.dependencies.length : 'None'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-white bg-opacity-50 rounded">
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Urgency</div>
                      <div className="font-bold text-lg">{task.urgency_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Importance</div>
                      <div className="font-bold text-lg">{task.importance_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Effort</div>
                      <div className="font-bold text-lg">{task.effort_score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Dependency</div>
                      <div className="font-bold text-lg">{task.dependency_score}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white bg-opacity-50 rounded mb-2">
                    <strong>Analysis:</strong> {task.explanation}
                  </div>

                  {task.dependencies.length > 0 && (
                    <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                      <strong>Blocks:</strong> {task.dependencies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions Section */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Top 3 Recommended Tasks for Today</h2>
            <div className="space-y-6">
              {suggestions.map((suggestion) => (
                <div key={suggestion.rank} className="relative border-2 border-indigo-300 rounded-lg p-6 bg-indigo-50">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                    {suggestion.rank}
                  </div>
                  <div className={`ml-8 border-2 rounded-lg p-4 ${getPriorityColor(suggestion.task.priority_level)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xl font-bold mb-1">{suggestion.task.title}</div>
                        <div className="text-sm font-semibold">
                          Priority Score: {suggestion.task.priority_score}/10
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(suggestion.task.priority_level)}`}>
                        {suggestion.task.priority_level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-600">Due Date</div>
                        <div className="font-medium">{suggestion.task.due_date}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Estimated Hours</div>
                        <div className="font-medium">{suggestion.task.estimated_hours}h</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Importance</div>
                        <div className="font-medium">{suggestion.task.importance}/10</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Dependencies</div>
                        <div className="font-medium">
                          {suggestion.task.dependencies.length > 0 ? suggestion.task.dependencies.length : 'None'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 ml-8 p-4 bg-white rounded-lg border-l-4 border-indigo-500">
                    <strong className="text-indigo-700">Why this task?</strong>
                    <p className="mt-2 text-gray-700">{suggestion.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
