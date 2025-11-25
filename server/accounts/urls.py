from django.urls import path
from .views import (
    RegisterView,
    VerifyEmailView,
    ResendVerificationEmailView,
    LoginView,
    LogoutView,
    UserProfileView,
    UserUpdateView,
    UserListView,
    UserDetailView,
    UserSearchView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path(
        "resend-verification-email/",
        ResendVerificationEmailView.as_view(),
        name="resend-verification-email",
    ),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("me/update/", UserUpdateView.as_view(), name="user-update"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:user_id>/", UserDetailView.as_view(), name="user-detail"),
    path("users/search/", UserSearchView.as_view(), name="user-search"),
]
