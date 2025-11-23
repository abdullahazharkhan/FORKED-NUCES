from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
	list_display = ("project_id", "title", "user", "github_url", "description" , "created_at")
	list_filter = ("created_at", "user")
	search_fields = ("title", "description", "user__nu_email")
	ordering = ("-created_at",)
