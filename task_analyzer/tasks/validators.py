from datetime import datetime
from typing import List, Dict, Tuple


class TaskValidator:

    @staticmethod
    def validate_tasks(tasks: List[Dict]) -> Tuple[bool, str, List[Dict]]:
        if not isinstance(tasks, list):
            return False, "Tasks must be a list", []

        if not tasks:
            return False, "Task list cannot be empty", []

        cleaned_tasks = []
        task_titles = set()

        for i, task in enumerate(tasks):
            if not isinstance(task, dict):
                return False, f"Task at index {i} must be an object", []

            if 'title' not in task or not task['title']:
                return False, f"Task at index {i} missing required field: title", []

            title = task['title'].strip()
            if title in task_titles:
                return False, f"Duplicate task title: {title}", []
            task_titles.add(title)

            cleaned_task = TaskValidator._clean_task(task)

            is_valid, error_msg = TaskValidator._validate_single_task(cleaned_task, task_titles)
            if not is_valid:
                return False, f"Task '{title}': {error_msg}", []

            cleaned_tasks.append(cleaned_task)

        has_cycle, cycle_msg = TaskValidator._check_circular_dependencies(cleaned_tasks)
        if has_cycle:
            return False, cycle_msg, []

        return True, "", cleaned_tasks

    @staticmethod
    def _clean_task(task: Dict) -> Dict:
        cleaned = {
            'title': task['title'].strip(),
            'due_date': task.get('due_date', ''),
            'estimated_hours': task.get('estimated_hours', 1),
            'importance': task.get('importance', 5),
            'dependencies': task.get('dependencies', [])
        }

        if cleaned['due_date']:
            try:
                datetime.strptime(cleaned['due_date'], '%Y-%m-%d')
            except:
                cleaned['due_date'] = ''

        try:
            cleaned['estimated_hours'] = float(cleaned['estimated_hours'])
            if cleaned['estimated_hours'] <= 0:
                cleaned['estimated_hours'] = 1
        except:
            cleaned['estimated_hours'] = 1

        try:
            cleaned['importance'] = int(cleaned['importance'])
            cleaned['importance'] = max(1, min(10, cleaned['importance']))
        except:
            cleaned['importance'] = 5

        if not isinstance(cleaned['dependencies'], list):
            cleaned['dependencies'] = []
        else:
            cleaned['dependencies'] = [str(d).strip() for d in cleaned['dependencies'] if d]

        return cleaned

    @staticmethod
    def _validate_single_task(task: Dict, all_titles: set) -> Tuple[bool, str]:
        if task['title'] in task.get('dependencies', []):
            return False, "Task cannot depend on itself"

        if task['due_date']:
            try:
                due_date = datetime.strptime(task['due_date'], '%Y-%m-%d').date()
                today = datetime.now().date()
            except:
                return False, f"Invalid due_date format. Use YYYY-MM-DD"

        if task['estimated_hours'] <= 0:
            return False, "estimated_hours must be positive"

        if task['importance'] < 1 or task['importance'] > 10:
            return False, "importance must be between 1 and 10"

        return True, ""

    @staticmethod
    def _check_circular_dependencies(tasks: List[Dict]) -> Tuple[bool, str]:
        task_map = {task['title']: task for task in tasks}
        task_titles = set(task_map.keys())

        for task in tasks:
            for dep in task['dependencies']:
                if dep not in task_titles:
                    continue

        def has_cycle(task_title: str, visited: set, rec_stack: set) -> Tuple[bool, List[str]]:
            visited.add(task_title)
            rec_stack.add(task_title)

            if task_title not in task_map:
                rec_stack.remove(task_title)
                return False, []

            for dep in task_map[task_title]['dependencies']:
                if dep not in task_map:
                    continue

                if dep not in visited:
                    has_cycle_found, path = has_cycle(dep, visited, rec_stack)
                    if has_cycle_found:
                        return True, [task_title] + path
                elif dep in rec_stack:
                    return True, [task_title, dep]

            rec_stack.remove(task_title)
            return False, []

        visited = set()
        for task_title in task_titles:
            if task_title not in visited:
                found_cycle, path = has_cycle(task_title, visited, set())
                if found_cycle:
                    cycle_str = " -> ".join(path)
                    return True, f"Circular dependency detected: {cycle_str}"

        return False, ""
