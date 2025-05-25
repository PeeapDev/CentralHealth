from functools import wraps
from backend.mongodb import get_audit_logs_collection, get_analytics_collection
from datetime import datetime

def log_audit(action_type):
    """
    Decorator to log audit trails in MongoDB.
    
    Usage:
    @log_audit('patient_view')
    def my_view(request):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            audit_logs = get_audit_logs_collection()
            
            # Log the action before execution
            log_entry = {
                'action_type': action_type,
                'user_id': str(request.user.id),
                'timestamp': datetime.utcnow(),
                'ip_address': request.META.get('REMOTE_ADDR'),
                'path': request.path,
                'method': request.method,
                'params': dict(request.GET),
            }
            
            try:
                response = view_func(request, *args, **kwargs)
                log_entry['status'] = response.status_code
                return response
            except Exception as e:
                log_entry['status'] = 500
                log_entry['error'] = str(e)
                raise
            finally:
                audit_logs.insert_one(log_entry)
        
        return wrapper
    return decorator

def track_analytics(category):
    """
    Decorator to track analytics data in MongoDB.
    
    Usage:
    @track_analytics('api_usage')
    def my_view(request):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            analytics = get_analytics_collection()
            start_time = datetime.utcnow()
            
            try:
                response = view_func(request, *args, **kwargs)
                status = response.status_code
            except Exception as e:
                status = 500
                raise
            finally:
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()
                
                analytics_entry = {
                    'category': category,
                    'timestamp': start_time,
                    'duration': duration,
                    'status': status,
                    'user_id': str(request.user.id),
                    'path': request.path,
                    'method': request.method,
                }
                
                analytics.insert_one(analytics_entry)
            
            return response
        
        return wrapper
    return decorator
