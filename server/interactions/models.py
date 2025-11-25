from django.db import models
from django.conf import settings

from projects.models import Project


class Comment(models.Model):
	comment_id = models.AutoField(primary_key=True)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="comments",
	)
	project = models.ForeignKey(
		Project,
		on_delete=models.CASCADE,
		related_name="comments",
	)
	comment_body = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:
		return f"Comment #{self.comment_id} by {self.user_id} on project {self.project_id}"


class Like(models.Model):
	like_id = models.AutoField(primary_key=True)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="likes",
	)
	project = models.ForeignKey(
		Project,
		on_delete=models.CASCADE,
		related_name="likes",
	)

	class Meta:
		unique_together = ("user", "project")
		indexes = [
			models.Index(fields=["user", "project"], name="like_user_project_idx"),
		]

	def __str__(self) -> str:
		return f"Like #{self.like_id} by {self.user_id} on project {self.project_id}"
