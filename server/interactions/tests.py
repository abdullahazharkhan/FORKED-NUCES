from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from projects.models import Project
from .models import Like


class ToggleProjectLikeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            nu_email="owner@nu.edu.pk",
            password="testpassword123",
            full_name="Project Owner",
        )
        self.other_user = User.objects.create_user(
            nu_email="other@nu.edu.pk",
            password="testpassword123",
            full_name="Other User",
        )
        self.project = Project.objects.create(
            user=self.owner,
            title="Launch Project",
            description="A project ready for collaboration.",
            github_url="https://github.com/example/launch-project",
        )
        self.url = reverse("project-like-toggle")

    def test_user_cannot_like_own_project(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(self.url, {"project_id": self.project.project_id}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Like.objects.count(), 0)

    def test_user_can_like_and_unlike_another_users_project(self):
        self.client.force_authenticate(user=self.other_user)

        like_response = self.client.post(self.url, {"project_id": self.project.project_id}, format="json")
        unlike_response = self.client.post(self.url, {"project_id": self.project.project_id}, format="json")

        self.assertEqual(like_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(unlike_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Like.objects.count(), 0)
