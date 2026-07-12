from urllib.parse import parse_qs, urlparse

from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User


class UserProfileViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            nu_email="test@nu.edu.pk", password="testpassword123", full_name="Test User"
        )
        self.url = reverse("user-profile")

    def test_get_user_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nu_email"], "test@nu.edu.pk")
        self.assertEqual(response.data["full_name"], "Test User")

    def test_get_user_profile_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class RegistrationPasswordConfirmationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registration_rejects_mismatched_passwords(self):
        response = self.client.post(
            reverse("register"),
            {
                "full_name": "Registration User",
                "nu_email": "registration-user@nu.edu.pk",
                "password": "StrongRegistrationPassword123!",
                "confirm_password": "DifferentPassword456!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["confirm_password"],
            ["Passwords do not match."],
        )
        self.assertFalse(
            User.objects.filter(nu_email="registration-user@nu.edu.pk").exists()
        )


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_BASE_URL="http://localhost:3000",
)
class PasswordResetFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            nu_email="reset-user@nu.edu.pk",
            password="OriginalPassword123!",
            full_name="Reset User",
            is_email_verified=True,
        )

    def test_email_link_resets_password_and_is_single_use(self):
        request_response = self.client.post(
            reverse("password-reset-request"),
            {"nu_email": self.user.nu_email},
            format="json",
        )

        self.assertEqual(request_response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Reset your FORKED NUCES password")

        reset_url = next(
            line
            for line in mail.outbox[0].body.splitlines()
            if line.startswith("http://localhost:3000/reset-password?")
        )
        parsed_url = urlparse(reset_url)
        query = parse_qs(parsed_url.query)
        self.assertEqual(parsed_url.path, "/reset-password")
        self.assertIn("Reset my password", mail.outbox[0].alternatives[0].content)

        payload = {
            "uid": query["uid"][0],
            "token": query["token"][0],
            "new_password": "UpdatedPassword456!",
            "confirm_password": "UpdatedPassword456!",
        }
        confirm_response = self.client.post(
            reverse("password-reset-confirm"),
            payload,
            format="json",
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("UpdatedPassword456!"))

        replay_response = self.client.post(
            reverse("password-reset-confirm"),
            payload,
            format="json",
        )
        self.assertEqual(replay_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_account_returns_not_found_without_sending_email(self):
        response = self.client.post(
            reverse("password-reset-request"),
            {"nu_email": "unknown@nu.edu.pk"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            response.data["detail"],
            "No account exists for this NU email address.",
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_active_unverified_account_gets_link_and_becomes_verified(self):
        self.user.is_email_verified = False
        self.user.save(update_fields=["is_email_verified"])

        request_response = self.client.post(
            reverse("password-reset-request"),
            {"nu_email": self.user.nu_email},
            format="json",
        )
        self.assertEqual(request_response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(mail.outbox[0].subject, "Reset your FORKED NUCES password")

        reset_url = next(
            line
            for line in mail.outbox[0].body.splitlines()
            if line.startswith("http://localhost:3000/reset-password?")
        )
        query = parse_qs(urlparse(reset_url).query)
        confirm_response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "uid": query["uid"][0],
                "token": query["token"][0],
                "new_password": "UpdatedPassword456!",
                "confirm_password": "UpdatedPassword456!",
            },
            format="json",
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)
