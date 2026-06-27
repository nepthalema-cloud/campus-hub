from django.utils.deprecation import MiddlewareMixin

class SessionCookieLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        print("REQUEST PATH:", request.path)
        print("REQUEST COOKIES:", request.COOKIES)
        print("REQUEST METHOD:", request.method)
        return None
