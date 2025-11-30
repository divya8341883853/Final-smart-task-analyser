from django.test import TestCase
from rest_framework.test import APIClient
from .priority_algorithm import TaskPriorityAnalyzer
from .validators import TaskValidator
from datetime import datetime, timedelta


class TaskPriorityAlgorithmTests(TestCase):

    def setUp(self):
        self.analyzer = TaskPriorityAnalyzer()

    def test_urgency_calculation_for_overdue_task(self):
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        task = {
            'title': 'Overdue Task',
            'due_date': yesterday,
            'estimated_hours': 2,
            'importance': 7,
            'dependencies': []
        }
        result = self.analyzer.calculate_priority(task, [task])
        self.assertEqual(result['urgency_score'], 10.0)
        self.assertGreater(result['priority_score'], 7.0)

    def test_importance_normalization(self):
        task = {
            'title': 'Important Task',
            'due_date': '2025-12-31',
            'estimated_hours': 3,
            'importance': 15,
            'dependencies': []
        }
        result = self.analyzer.calculate_priority(task, [task])
        self.assertEqual(result['importance_score'], 10.0)

    def test_dependency_score_calculation(self):
        task1 = {
            'title': 'Foundation Task',
            'due_date': '2025-12-15',
            'estimated_hours': 4,
            'importance': 8,
            'dependencies': []
        }
        task2 = {
            'title': 'Dependent Task 1',
            'due_date': '2025-12-20',
            'estimated_hours': 2,
            'importance': 6,
            'dependencies': ['Foundation Task']
        }
        task3 = {
            'title': 'Dependent Task 2',
            'due_date': '2025-12-20',
            'estimated_hours': 2,
            'importance': 6,
            'dependencies': ['Foundation Task']
        }
        tasks = [task1, task2, task3]
        result = self.analyzer.calculate_priority(task1, tasks)
        self.assertGreaterEqual(result['dependency_score'], 6.0)


class TaskValidatorTests(TestCase):

    def test_circular_dependency_detection(self):
        tasks = [
            {
                'title': 'Task A',
                'due_date': '2025-12-15',
                'estimated_hours': 2,
                'importance': 5,
                'dependencies': ['Task B']
            },
            {
                'title': 'Task B',
                'due_date': '2025-12-16',
                'estimated_hours': 3,
                'importance': 6,
                'dependencies': ['Task A']
            }
        ]
        is_valid, error_msg, _ = TaskValidator.validate_tasks(tasks)
        self.assertFalse(is_valid)
        self.assertIn('Circular dependency', error_msg)

    def test_self_dependency_detection(self):
        tasks = [
            {
                'title': 'Task A',
                'due_date': '2025-12-15',
                'estimated_hours': 2,
                'importance': 5,
                'dependencies': ['Task A']
            }
        ]
        is_valid, error_msg, _ = TaskValidator.validate_tasks(tasks)
        self.assertFalse(is_valid)
        self.assertIn('cannot depend on itself', error_msg)

    def test_valid_tasks_pass_validation(self):
        tasks = [
            {
                'title': 'Task A',
                'due_date': '2025-12-15',
                'estimated_hours': 2,
                'importance': 5,
                'dependencies': []
            },
            {
                'title': 'Task B',
                'due_date': '2025-12-16',
                'estimated_hours': 3,
                'importance': 8,
                'dependencies': ['Task A']
            }
        ]
        is_valid, error_msg, cleaned = TaskValidator.validate_tasks(tasks)
        self.assertTrue(is_valid)
        self.assertEqual(len(cleaned), 2)


class APIEndpointTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_analyze_tasks_endpoint(self):
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        data = {
            'tasks': [
                {
                    'title': 'Fix login bug',
                    'due_date': tomorrow,
                    'estimated_hours': 3,
                    'importance': 8,
                    'dependencies': []
                },
                {
                    'title': 'Update documentation',
                    'due_date': '2025-12-31',
                    'estimated_hours': 2,
                    'importance': 5,
                    'dependencies': []
                }
            ]
        }
        response = self.client.post('/api/tasks/analyze/', data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('tasks', response.data)
        self.assertEqual(len(response.data['tasks']), 2)
        self.assertIn('priority_score', response.data['tasks'][0])

    def test_suggest_tasks_endpoint(self):
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        data = {
            'tasks': [
                {
                    'title': 'Critical Bug Fix',
                    'due_date': tomorrow,
                    'estimated_hours': 2,
                    'importance': 9,
                    'dependencies': []
                },
                {
                    'title': 'Refactor Code',
                    'due_date': '2025-12-31',
                    'estimated_hours': 8,
                    'importance': 6,
                    'dependencies': []
                }
            ]
        }
        response = self.client.post('/api/tasks/suggest/', data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('suggestions', response.data)
        self.assertLessEqual(len(response.data['suggestions']), 3)

    def test_empty_tasks_error(self):
        data = {'tasks': []}
        response = self.client.post('/api/tasks/analyze/', data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
