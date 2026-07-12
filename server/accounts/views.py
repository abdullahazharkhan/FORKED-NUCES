import logging

from django.contrib.auth.hashers import make_password
from django.db import IntegrityError
from django.db.models import Q
from django.db.models.functions import Lower
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .exports import stream_user_data_export
from .serializers import (
    AccountDeletionSerializer,
    RegisterSerializer,
    UserSerializer,
    UserDirectoryQuerySerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserUpdateSerializer,
    VerifiedTokenObtainPairSerializer,
    VerifiedTokenRefreshSerializer,
    send_verification_email,
)
from .security import (
    PASSWORD_RESET_REQUEST_MESSAGE,
    invalidate_user_sessions,
    send_neutral_account_request_notice,
    send_password_reset_email,
)


logger = logging.getLogger(__name__)
EMAIL_UNIQUE_CONSTRAINTS = {
    "accounts_user_nu_email_key",
    "accounts_user_nu_email_ci_unique",
}
REGISTRATION_REQUEST_MESSAGE = (
    "If this NU email is eligible, registration instructions have been sent."
)
VERIFICATION_RESEND_REQUEST_MESSAGE = (
    "If an active, unverified account exists for this NU email, verification "
    "instructions have been sent."
)


def _is_email_uniqueness_violation(exc):
    for candidate in (exc, getattr(exc, "__cause__", None)):
        constraint_name = getattr(
            getattr(candidate, "diag", None),
            "constraint_name",
            None,
        )
        if constraint_name in EMAIL_UNIQUE_CONSTRAINTS:
            return True
    message = str(exc).lower()
    return "unique" in message and "nu_email" in message


def _deliver_verification_email(user, token, request):
    try:
        send_verification_email(user, token, request=request)
    except Exception:
        logger.exception(
            "Verification email delivery failed for user_id=%s",
            user.user_id,
        )
        return False
    return True


def _deliver_neutral_account_notice(nu_email, purpose):
    try:
        send_neutral_account_request_notice(nu_email, purpose)
    except Exception:
        logger.exception(
            "Neutral account request notice delivery failed for purpose=%s",
            purpose,
        )


def _perform_dummy_password_hash(raw_password):
    """Match the password-hashing work performed for a new registration."""

    make_password(raw_password)


class VerifiedTokenObtainPairView(TokenObtainPairView):
    serializer_class = VerifiedTokenObtainPairSerializer
    throttle_scope = "token"


class VerifiedTokenRefreshView(TokenRefreshView):
    serializer_class = VerifiedTokenRefreshSerializer
    throttle_scope = "token"


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    throttle_scope = "register"

    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if User.objects.filter(
            nu_email=serializer.validated_data["nu_email"]
        ).exists():
            _perform_dummy_password_hash(serializer.validated_data["password"])
            _deliver_neutral_account_notice(
                serializer.validated_data["nu_email"],
                "registration",
            )
            return Response(
                {"message": REGISTRATION_REQUEST_MESSAGE},
                status=status.HTTP_202_ACCEPTED,
            )
        try:
            user = serializer.save()
        except IntegrityError as exc:
            if not _is_email_uniqueness_violation(exc):
                raise
            _deliver_neutral_account_notice(
                serializer.validated_data["nu_email"],
                "registration",
            )
            return Response(
                {"message": REGISTRATION_REQUEST_MESSAGE},
                status=status.HTTP_202_ACCEPTED,
            )

        _deliver_verification_email(
            user,
            user._verification_token,
            request,
        )
        return Response(
            {"message": REGISTRATION_REQUEST_MESSAGE},
            status=status.HTTP_202_ACCEPTED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "verify_email"

    def post(self, request, *args, **kwargs):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Email successfully verified.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "resend_verification"

    def post(self, request, *args, **kwargs):
        serializer = ResendVerificationSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if user is not None:
            _deliver_verification_email(
                user,
                user._verification_token,
                request,
            )
        else:
            _deliver_neutral_account_notice(
                serializer.validated_data["nu_email"],
                "verification",
            )
        return Response(
            {"message": VERIFICATION_RESEND_REQUEST_MESSAGE},
            status=status.HTTP_202_ACCEPTED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens_and_user = serializer.save()
        return Response(tokens_and_user, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Successfully logged out."},
            status=status.HTTP_205_RESET_CONTENT,
        )


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer
    throttle_scope = "password_reset_request"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user()
        if user is not None and user.has_usable_password():
            try:
                send_password_reset_email(user)
            except Exception:
                logger.exception(
                    "Password reset email delivery failed for user_id=%s",
                    user.user_id,
                )
        else:
            _deliver_neutral_account_notice(
                serializer.validated_data["nu_email"],
                "password_reset",
            )

        return Response(
            {"message": PASSWORD_RESET_REQUEST_MESSAGE},
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    throttle_scope = "password_reset_confirm"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password reset successfully. Please sign in again."},
            status=status.HTTP_200_OK,
        )


class PasswordChangeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PasswordChangeSerializer
    throttle_scope = "password_change"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Password changed successfully. Please sign in again."},
            status=status.HTTP_200_OK,
        )


class LogoutAllView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "logout_all"

    def post(self, request, *args, **kwargs):
        invalidate_user_sessions(request.user)
        return Response(
            {"message": "Successfully logged out from all sessions."},
            status=status.HTTP_205_RESET_CONTENT,
        )


class UserProfileView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_object(self):
        return self.request.user


class UserDataExportView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "account_export"

    def get(self, request, *args, **kwargs):
        response = StreamingHttpResponse(
            stream_user_data_export(request.user),
            content_type="application/json",
        )
        response["Cache-Control"] = "no-store"
        response["Pragma"] = "no-cache"
        response["Content-Disposition"] = (
            f'attachment; filename="forked-nuces-data-{request.user.user_id}.json"'
        )
        return response


class UserDeleteView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AccountDeletionSerializer
    throttle_scope = "account_delete"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Account deleted and personal profile data anonymized."},
            status=status.HTTP_200_OK,
        )


class UserUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserUpdateSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


def _user_directory_queryset(request):
    params = UserDirectoryQuerySerializer(data=request.query_params)
    params.is_valid(raise_exception=True)
    search = params.validated_data.get("search", "")
    skill = params.validated_data.get("skill", "")
    ordering = params.validated_data["ordering"]

    queryset = User.objects.filter(is_active=True).exclude(pk=request.user.pk)
    if search:
        queryset = queryset.filter(
            Q(full_name__icontains=search) | Q(nu_email__icontains=search)
        )
    if skill:
        queryset = queryset.filter(skills__skill__icontains=skill).distinct()

    if ordering == UserDirectoryQuerySerializer.ORDER_NEWEST:
        queryset = queryset.order_by("-created_at", "-user_id")
    elif ordering == UserDirectoryQuerySerializer.ORDER_OLDEST:
        queryset = queryset.order_by("created_at", "user_id")
    else:
        queryset = queryset.order_by(Lower("full_name"), "user_id")
    return queryset.prefetch_related("skills")


class UserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return _user_directory_queryset(self.request)


class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    lookup_field = "user_id"
    queryset = User.objects.filter(is_active=True).prefetch_related("skills")


class UserSearchView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return _user_directory_queryset(self.request)
