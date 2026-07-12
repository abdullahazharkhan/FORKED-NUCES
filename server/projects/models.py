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
		default=STATUS_OPEN,
	)
	title = models.CharField(max_length=255)
	description = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self) -> str:
		return f"Issue #{self.issue_id} - {self.title}"


class Collaborator(models.Model):
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="issue_collaborations",
	)
	issue = models.ForeignKey(
		Issue,
		on_delete=models.CASCADE,
		related_name="collaborators",
	)

	class Meta:
		unique_together = ("user", "issue")
		indexes = [
			models.Index(fields=["user", "issue"]),
		]

	def __str__(self) -> str:
		return f"User {self.user_id} on Issue {self.issue_id}"


class CollaborationRequest(models.Model):
	KIND_APPLICATION = "application"
	KIND_INVITATION = "invitation"
	KIND_CHOICES = [
		(KIND_APPLICATION, "Application"),
		(KIND_INVITATION, "Invitation"),
	]

	STATUS_PENDING = "pending"
	STATUS_ACCEPTED = "accepted"
	STATUS_REJECTED = "rejected"
	STATUS_WITHDRAWN = "withdrawn"
	STATUS_CANCELLED = "cancelled"
	STATUS_CHOICES = [
		(STATUS_PENDING, "Pending"),
		(STATUS_ACCEPTED, "Accepted"),
		(STATUS_REJECTED, "Rejected"),
		(STATUS_WITHDRAWN, "Withdrawn"),
		(STATUS_CANCELLED, "Cancelled"),
	]

	request_id = models.AutoField(primary_key=True)
	issue = models.ForeignKey(
		Issue,
		db_index=False,
		on_delete=models.CASCADE,
		related_name="collaboration_requests",
	)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="collaboration_requests",
	)
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		related_name="created_collaboration_requests",
	)
	resolved_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="resolved_collaboration_requests",
	)
	kind = models.CharField(max_length=11, choices=KIND_CHOICES)
	status = models.CharField(
		max_length=9,
		choices=STATUS_CHOICES,
		default=STATUS_PENDING,
	)
	message = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	responded_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["issue", "user"],
				name="projects_collaboration_request_issue_user_unique",
			),
			models.CheckConstraint(
				condition=models.Q(kind__in=["application", "invitation"]),
				name="collaboration_request_kind_valid",
			),
			models.CheckConstraint(
				condition=models.Q(
					status__in=[
						"pending",
						"accepted",
						"rejected",
						"withdrawn",
						"cancelled",
					]
				),
				name="collaboration_request_status_valid",
			),
			models.CheckConstraint(
				condition=(
					models.Q(
						status="pending",
						resolved_by__isnull=True,
						responded_at__isnull=True,
					)
					| (
						~models.Q(status="pending")
						& models.Q(responded_at__isnull=False)
					)
				),
				name="collaboration_request_resolution_valid",
			),
		]
		indexes = [
			models.Index(
				fields=["issue", "status", "-created_at", "-request_id"],
				name="collab_req_issue_status_idx",
			),
			models.Index(
				fields=["issue", "-created_at", "-request_id"],
				name="collab_req_issue_created_idx",
			),
		]
		ordering = ["-created_at", "-request_id"]

	def __str__(self) -> str:
		return f"{self.kind} for user {self.user_id} on issue {self.issue_id} ({self.status})"
