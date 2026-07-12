from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class ArrayLimitOffsetPagination(LimitOffsetPagination):
    """Bound list responses while retaining the array body expected by clients."""

    default_limit = 50
    max_limit = 100

    def get_paginated_response(self, data):
        headers = {
            "X-Total-Count": str(self.count),
            "X-Limit": str(self.limit),
            "X-Offset": str(self.offset),
        }
        links = []
        if self.get_next_link():
            links.append(f'<{self.get_next_link()}>; rel="next"')
        if self.get_previous_link():
            links.append(f'<{self.get_previous_link()}>; rel="prev"')
        if links:
            headers["Link"] = ", ".join(links)
        return Response(data, headers=headers)

    def get_paginated_response_schema(self, schema):
        return {"type": "array", "items": schema}
