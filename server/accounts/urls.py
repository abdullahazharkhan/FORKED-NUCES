from django.urls import path
from .views import (
    RegisterView,
    VerifyEmailView,
    ResendVerificationEmailView,
    LoginView,
    LogoutView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification-email/", ResendVerificationEmailView.as_view(), name="resend-verification-email"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
]