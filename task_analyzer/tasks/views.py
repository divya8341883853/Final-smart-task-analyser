from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .priority_algorithm import TaskPriorityAnalyzer
from .validators import TaskValidator


@api_view(['POST'])
def analyze_tasks(request):
    try:
        tasks = request.data.get('tasks', [])

        if not tasks:
            return Response(
                {'error': 'No tasks provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid, error_msg, cleaned_tasks = TaskValidator.validate_tasks(tasks)

        if not is_valid:
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        analyzer = TaskPriorityAnalyzer()
        analyzed_tasks = analyzer.analyze_tasks(cleaned_tasks)

        return Response({
            'tasks': analyzed_tasks,
            'count': len(analyzed_tasks)
        })

    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def suggest_tasks(request):
    try:
        tasks = request.data.get('tasks', [])

        if not tasks:
            return Response(
                {'error': 'No tasks provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid, error_msg, cleaned_tasks = TaskValidator.validate_tasks(tasks)

        if not is_valid:
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        analyzer = TaskPriorityAnalyzer()
        suggestions = analyzer.get_top_suggestions(cleaned_tasks, count=3)

        return Response({
            'suggestions': suggestions,
            'message': 'Here are your top 3 recommended tasks for today'
        })

    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
