from django.contrib import admin

from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
	list_display = ("comment_id", "user", "project", "created_at")
	list_filter = ("created_at", "project")
	search_fields = ("comment_body", "user__full_name", "user__nu_email")
