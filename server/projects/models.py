from django.db import models
from django.conf import settings


class Project(models.Model):
	project_id = models.AutoField(primary_key=True)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="projects",
	)
	title = models.CharField(max_length=255)
	description = models.TextField()
	github_url = models.URLField()
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:
		return self.title


class Tag(models.Model):
	project = models.ForeignKey(
		Project,
		on_delete=models.CASCADE,
		related_name="tags",
	)
	tag = models.CharField(max_length=100)

	class Meta:
		unique_together = ("project", "tag")
		indexes = [
			models.Index(fields=["project", "tag"]),
		]

	def __str__(self) -> str:
		return f"{self.project_id} - {self.tag}"


class Issue(models.Model):
	STATUS_OPEN = "open"
	STATUS_CLOSED = "closed"
	STATUS_CHOICES = [
		(STATUS_OPEN, "Open"),
		(STATUS_CLOSED, "Closed"),
	]

	issue_id = models.AutoField(primary_key=True)
	project = models.ForeignKey(
		Project,
		on_delete=models.CASCADE,
		related_name="issues",
	)
	status = models.CharField(
		max_length=6,
		choices=STATUS_CHOICES,
		default=STATUS_CLOSED,
	)
	title = models.CharField(max_length=255)
	description = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:
		return f"Issue #{self.issue_id} - {self.title}"
