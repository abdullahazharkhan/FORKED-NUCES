from django.contrib import admin
from django.utils import timezone

from .models import CollaborationRequest, Collaborator, Issue, Project, Tag


class TagInline(admin.TabularInline):
	model = Tag
	extra = 0


class IssueInline(admin.TabularInline):
	model = Issue
	extra = 0
	show_change_link = True


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
	list_display = ("project_id", "title", "user", "github_url", "description" , "created_at")
	list_filter = ("created_at", "user")
	search_fields = ("title", "description", "user__nu_email")
	ordering = ("-created_at",)
	inlines = (TagInline, IssueInline)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
	list_display = ("id", "project", "tag")
	list_filter = ("tag",)
	search_fields = ("tag", "project__title")


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
	list_display = ("issue_id", "title", "project", "status", "created_at")
	list_filter = ("status", "created_at")
	search_fields = ("title", "description", "project__title")


@admin.register(Collaborator)
class CollaboratorAdmin(admin.ModelAdmin):
	list_display = ("id", "user", "issue")
	search_fields = ("user__nu_email", "user__full_name", "issue__title")


@admin.register(CollaborationRequest)
class CollaborationRequestAdmin(admin.ModelAdmin):
	list_display = (
		"request_id",
		"issue",
		"user",
		"kind",
		"status",
		"created_at",
		"responded_at",
	)
	list_filter = ("kind", "status", "created_at")
	search_fields = (
		"user__nu_email",
		"user__full_name",
		"issue__title",
		"issue__project__title",
	)
	readonly_fields = (
		"created_at",
		"updated_at",
		"responded_at",
		"resolved_by",
	)

	def save_model(self, request, obj, form, change):
		previous_status = None
		if change:
			previous_status = (
				CollaborationRequest.objects.filter(pk=obj.pk)
				.values_list("status", flat=True)
				.first()
			)

		if obj.status == CollaborationRequest.STATUS_PENDING:
			obj.resolved_by = None
			obj.responded_at = None
		elif not change or previous_status != obj.status:
			obj.resolved_by = request.user
			obj.responded_at = timezone.now()
		elif obj.responded_at is None:
			obj.responded_at = timezone.now()

		super().save_model(request, obj, form, change)
