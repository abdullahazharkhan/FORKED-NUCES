from rest_framework import serializers


class EarlyBoundedListField(serializers.ListField):
    """Reject oversized JSON arrays before validating every child element."""

    def to_internal_value(self, data):
        if (
            isinstance(data, (list, tuple))
            and self.max_length is not None
            and len(data) > self.max_length
        ):
            self.fail("max_length", max_length=self.max_length)
        return super().to_internal_value(data)
