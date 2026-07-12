import re
import uuid
from contextvars import ContextVar


_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
_request_id: ContextVar[str] = ContextVar("request_id", default="-")


def current_request_id() -> str:
    return _request_id.get()


class RequestIdMiddleware:
    """Attach a safe correlation id to every request, response, and log record."""

    header_name = "HTTP_X_REQUEST_ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        supplied_id = request.META.get(self.header_name, "")
        request_id = (
            supplied_id
            if _REQUEST_ID_PATTERN.fullmatch(supplied_id)
            else uuid.uuid4().hex
        )
        request.request_id = request_id
        token = _request_id.set(request_id)
        try:
            response = self.get_response(request)
            response["X-Request-ID"] = request_id
            return response
        finally:
            _request_id.reset(token)


class RequestIdLogFilter:
    def filter(self, record):
        request = getattr(record, "request", None)
        record.request_id = getattr(request, "request_id", current_request_id())
        return True
