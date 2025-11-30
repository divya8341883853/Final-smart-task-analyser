from datetime import datetime, date
from typing import List, Dict


class TaskPriorityAnalyzer:

    def calculate_priority(self, task: Dict, all_tasks: List[Dict]) -> Dict:
        urgency_score = self._calculate_urgency(task.get('due_date'))
        importance_score = self._normalize_importance(task.get('importance', 5))
        effort_score = self._calculate_effort_score(task.get('estimated_hours', 1))
        dependency_score = self._calculate_dependency_score(task, all_tasks)

        priority_score = (
            urgency_score * 0.35 +
            importance_score * 0.30 +
            effort_score * 0.20 +
            dependency_score * 0.15
        )

        explanation = self._generate_explanation(
            task, urgency_score, importance_score, effort_score, dependency_score, priority_score
        )

        task['priority_score'] = round(priority_score, 2)
        task['explanation'] = explanation
        task['priority_level'] = self._get_priority_level(priority_score)
        task['urgency_score'] = round(urgency_score, 2)
        task['importance_score'] = round(importance_score, 2)
        task['effort_score'] = round(effort_score, 2)
        task['dependency_score'] = round(dependency_score, 2)

        return task

    def _calculate_urgency(self, due_date_str: str) -> float:
        if not due_date_str:
            return 5.0

        try:
            if isinstance(due_date_str, date):
                due_date = due_date_str
            else:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()

            today = datetime.now().date()
            days_remaining = (due_date - today).days

            if days_remaining < 0:
                return 10.0
            elif days_remaining == 0:
                return 9.5
            elif days_remaining <= 1:
                return 9.0
            elif days_remaining <= 3:
                return 8.0
            elif days_remaining <= 7:
                return 6.5
            elif days_remaining <= 14:
                return 5.0
            elif days_remaining <= 30:
                return 3.5
            else:
                return 2.0
        except:
            return 5.0

    def _normalize_importance(self, importance: int) -> float:
        if importance is None:
            return 5.0

        importance = max(1, min(10, importance))
        return float(importance)

    def _calculate_effort_score(self, estimated_hours: float) -> float:
        if estimated_hours is None or estimated_hours <= 0:
            return 5.0

        if estimated_hours <= 1:
            return 9.0
        elif estimated_hours <= 2:
            return 8.0
        elif estimated_hours <= 4:
            return 6.5
        elif estimated_hours <= 8:
            return 5.0
        elif estimated_hours <= 16:
            return 3.5
        else:
            return 2.0

    def _calculate_dependency_score(self, task: Dict, all_tasks: List[Dict]) -> float:
        task_title = task.get('title')
        blocking_count = 0

        for other_task in all_tasks:
            dependencies = other_task.get('dependencies', [])
            if task_title in dependencies:
                blocking_count += 1

        if blocking_count >= 3:
            return 10.0
        elif blocking_count == 2:
            return 8.0
        elif blocking_count == 1:
            return 6.0
        else:
            return 5.0

    def _generate_explanation(self, task: Dict, urgency: float, importance: float,
                             effort: float, dependency: float, priority: float) -> str:
        parts = []

        if urgency >= 9.0:
            parts.append("URGENT - Due very soon or overdue")
        elif urgency >= 7.0:
            parts.append("High urgency - Due within days")
        elif urgency >= 5.0:
            parts.append("Moderate urgency - Due within weeks")
        else:
            parts.append("Low urgency - Ample time remaining")

        if importance >= 8:
            parts.append("High importance")
        elif importance >= 6:
            parts.append("Medium importance")
        else:
            parts.append("Lower importance")

        if effort >= 8.0:
            parts.append("Quick win (low effort)")
        elif effort >= 6.0:
            parts.append("Moderate effort required")
        else:
            parts.append("Significant effort needed")

        if dependency >= 8.0:
            parts.append("BLOCKS multiple other tasks")
        elif dependency >= 6.0:
            parts.append("Blocks other tasks")

        return ". ".join(parts) + "."

    def _get_priority_level(self, score: float) -> str:
        if score >= 7.5:
            return "High"
        elif score >= 5.0:
            return "Medium"
        else:
            return "Low"

    def analyze_tasks(self, tasks: List[Dict]) -> List[Dict]:
        analyzed_tasks = []

        for task in tasks:
            analyzed_task = self.calculate_priority(task, tasks)
            analyzed_tasks.append(analyzed_task)

        analyzed_tasks.sort(key=lambda x: x['priority_score'], reverse=True)

        return analyzed_tasks

    def get_top_suggestions(self, tasks: List[Dict], count: int = 3) -> List[Dict]:
        analyzed_tasks = self.analyze_tasks(tasks)

        top_tasks = analyzed_tasks[:count]

        suggestions = []
        for i, task in enumerate(top_tasks, 1):
            suggestion = {
                'rank': i,
                'task': task,
                'reason': self._generate_suggestion_reason(task, i)
            }
            suggestions.append(suggestion)

        return suggestions

    def _generate_suggestion_reason(self, task: Dict, rank: int) -> str:
        reasons = []

        if task['urgency_score'] >= 9.0:
            reasons.append("This task is overdue or due immediately")
        elif task['urgency_score'] >= 7.0:
            reasons.append("This task is due very soon")

        if task['importance_score'] >= 8:
            reasons.append("It's highly important to your goals")

        if task['effort_score'] >= 8.0:
            reasons.append("It's a quick win that won't take much time")

        if task['dependency_score'] >= 8.0:
            reasons.append("Completing this will unblock multiple other tasks")

        if not reasons:
            reasons.append("It has a good balance of urgency, importance, and effort")

        priority_reason = f"Priority Score: {task['priority_score']}/10. " + " and ".join(reasons) + "."

        return priority_reason
