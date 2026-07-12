from io import StringIO
from unittest.mock import Mock, patch

from django.core.mail import EmailMessage
from django.test import SimpleTestCase, override_settings

from .email_backends import DevelopmentEmailBackend


class DevelopmentEmailBackendTests(SimpleTestCase):
    @override_settings(
        EMAIL_DELIVERY_BACKEND="django.core.mail.backends.locmem.EmailBackend"
    )
    @patch("drf_backend.email_backends.get_connection")
    def test_prints_email_and_forwards_it_to_delivery_backend(self, get_connection):
        delivery = Mock()
        delivery.send_messages.return_value = 1
        get_connection.return_value = delivery
        output = StringIO()
        message = EmailMessage(
            subject="Development email",
            body="This body should be visible in the backend console.",
            from_email="sender@nu.edu.pk",
            to=["recipient@nu.edu.pk"],
        )

        sent = DevelopmentEmailBackend(stream=output).send_messages([message])

        self.assertEqual(sent, 1)
        self.assertIn("Subject: Development email", output.getvalue())
        self.assertIn(
            "This body should be visible in the backend console.",
            output.getvalue(),
        )
        delivery.send_messages.assert_called_once_with([message])
