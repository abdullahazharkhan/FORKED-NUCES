from django.conf import settings
from django.core.mail import get_connection
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend


class DevelopmentEmailBackend(BaseEmailBackend):
    """Print each email to stdout, then send it through the delivery backend."""

    def __init__(self, *args, stream=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.stream = stream

    def send_messages(self, email_messages):
        messages = list(email_messages or [])
        if not messages:
            return 0

        console_options = {"fail_silently": self.fail_silently}
        if self.stream is not None:
            console_options["stream"] = self.stream
        ConsoleEmailBackend(**console_options).send_messages(messages)

        delivery_backend = settings.EMAIL_DELIVERY_BACKEND
        connection = get_connection(
            backend=delivery_backend,
            fail_silently=self.fail_silently,
        )
        return connection.send_messages(messages)
