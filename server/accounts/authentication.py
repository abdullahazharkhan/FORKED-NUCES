from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from .security import has_current_session_version


class SessionVersionJWTAuthentication(JWTAuthentication):
    """Reject access tokens issued before the user's latest session reset."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not has_current_session_version(validated_token, user):
            raise AuthenticationFailed(
                "This session has been revoked. Please sign in again.",
                code="session_revoked",
            )
        return user
