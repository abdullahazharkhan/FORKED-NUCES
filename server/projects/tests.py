from django.test import SimpleTestCase

from .serializers import ProjectCreateSerializer, ProjectUpdateSerializer


class ProjectGitHubUrlValidationTests(SimpleTestCase):
	def serializer_data(self, github_url):
		return {
			"title": "Test project",
			"description": "A project used to test URL validation.",
			"github_url": github_url,
			"tags": ["frontend"],
		}

	def test_repository_urls_are_accepted_for_create_and_update(self):
		valid_urls = [
			"https://github.com/octocat/Hello-World",
			"https://github.com/user-123/project.name",
		]

		for serializer_class in (ProjectCreateSerializer, ProjectUpdateSerializer):
			for github_url in valid_urls:
				with self.subTest(serializer=serializer_class.__name__, url=github_url):
					serializer = serializer_class(data=self.serializer_data(github_url))
					self.assertTrue(serializer.is_valid(), serializer.errors)

	def test_non_repository_urls_are_rejected_for_create_and_update(self):
		invalid_urls = [
			"http://github.com/octocat/Hello-World",
			"https://www.github.com/octocat/Hello-World",
			"https://github.com/octocat",
			"https://github.com/octocat/Hello-World/issues",
			"https://github.com/octocat/Hello-World?tab=readme",
			"https://gitlab.com/octocat/Hello-World",
		]

		for serializer_class in (ProjectCreateSerializer, ProjectUpdateSerializer):
			for github_url in invalid_urls:
				with self.subTest(serializer=serializer_class.__name__, url=github_url):
					serializer = serializer_class(data=self.serializer_data(github_url))
					self.assertFalse(serializer.is_valid())
					self.assertIn("github_url", serializer.errors)
