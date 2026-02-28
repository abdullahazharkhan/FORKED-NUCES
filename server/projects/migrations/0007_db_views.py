from django.db import migrations

# ============================================================
# Forward SQL — create all DB views and functions in order
# (dependent views must come after their dependencies)
# ============================================================
FORWARD_SQL = [
    # 1. project_summary_view — base view used by other views
    """
    CREATE OR REPLACE VIEW project_summary_view AS
    SELECT
        p.project_id,
        p.title,
        p.description,
        p.github_url,
        p.user_id AS owner_id,
        u.full_name AS owner_full_name,
        u.nu_email AS owner_nu_email,
        u.avatar_url AS owner_avatar_url,
        COUNT(DISTINCT l.like_id) AS likes_count,
        COUNT(DISTINCT c.comment_id) AS comments_count,
        COUNT(DISTINCT CASE WHEN i.status = 'open' THEN i.issue_id END) AS open_issues,
        COUNT(DISTINCT CASE WHEN i.status = 'closed' THEN i.issue_id END) AS closed_issues,
        (COUNT(DISTINCT l.like_id) + COUNT(DISTINCT c.comment_id)) AS engagement_score,
        EXTRACT(EPOCH FROM (NOW() - p.updated_at)) / 86400.0 AS days_since_update,
        p.created_at,
        p.updated_at
    FROM projects_project p
    JOIN accounts_user u ON p.user_id = u.user_id
    LEFT JOIN interactions_like l ON l.project_id = p.project_id
    LEFT JOIN interactions_comment c ON c.project_id = p.project_id
    LEFT JOIN projects_issue i ON i.project_id = p.project_id
    GROUP BY p.project_id, u.user_id, u.full_name, u.nu_email, u.avatar_url
    """,

    # 2. project_tags_flat_view — flat project+tag pairs for skill matching
    """
    CREATE OR REPLACE VIEW project_tags_flat_view AS
    SELECT
        t.project_id,
        LOWER(t.tag) AS tag
    FROM projects_tag t
    """,

    # 3. trending_projects_view — adds trending_score on top of project_summary_view
    """
    CREATE OR REPLACE VIEW trending_projects_view AS
    SELECT
        project_id,
        title,
        description,
        github_url,
        owner_id,
        owner_full_name,
        owner_nu_email,
        owner_avatar_url,
        likes_count,
        comments_count,
        open_issues,
        closed_issues,
        engagement_score,
        days_since_update,
        created_at,
        updated_at,
        (engagement_score / GREATEST(days_since_update, 1.0)) AS trending_score
    FROM project_summary_view
    """,

    # 4. projects_needing_help_view — projects with open issues
    """
    CREATE OR REPLACE VIEW projects_needing_help_view AS
    SELECT
        project_id,
        title,
        description,
        github_url,
        owner_id,
        owner_full_name,
        owner_nu_email,
        owner_avatar_url,
        likes_count,
        comments_count,
        open_issues,
        closed_issues,
        engagement_score,
        days_since_update,
        created_at,
        updated_at
    FROM project_summary_view
    WHERE open_issues > 0
    """,

    # 5. top_contributors_view — users ranked by activity score using RANK()
    """
    CREATE OR REPLACE VIEW top_contributors_view AS
    SELECT
        u.user_id,
        u.full_name,
        u.nu_email,
        u.avatar_url,
        COUNT(DISTINCT p.project_id) AS projects_created,
        COUNT(DISTINCT col.issue_id) AS issues_collaborated,
        COUNT(DISTINCT c.comment_id) AS comments_made,
        (
            COUNT(DISTINCT p.project_id) * 3
            + COUNT(DISTINCT col.issue_id) * 2
            + COUNT(DISTINCT c.comment_id)
        ) AS activity_score,
        RANK() OVER (
            ORDER BY (
                COUNT(DISTINCT p.project_id) * 3
                + COUNT(DISTINCT col.issue_id) * 2
                + COUNT(DISTINCT c.comment_id)
            ) DESC
        ) AS rank
    FROM accounts_user u
    LEFT JOIN projects_project p ON p.user_id = u.user_id
    LEFT JOIN projects_collaborator col ON col.user_id = u.user_id
    LEFT JOIN interactions_comment c ON c.user_id = u.user_id
    GROUP BY u.user_id, u.full_name, u.nu_email, u.avatar_url
    """,

    # 6. user_activity_view — full per-user activity stats
    """
    CREATE OR REPLACE VIEW user_activity_view AS
    SELECT
        u.user_id,
        u.full_name,
        u.nu_email,
        u.avatar_url,
        u.bio,
        u.github_username,
        u.is_github_connected,
        u.created_at AS member_since,
        COUNT(DISTINCT p.project_id) AS projects_created,
        COUNT(DISTINCT col.issue_id) AS issues_collaborated,
        COUNT(DISTINCT col_proj.project_id) AS projects_collaborated,
        COUNT(DISTINCT l.like_id) AS likes_given,
        COUNT(DISTINCT c.comment_id) AS comments_made,
        COUNT(DISTINCT sk.id) AS skill_count,
        (
            COUNT(DISTINCT p.project_id) * 3
            + COUNT(DISTINCT col.issue_id) * 2
            + COUNT(DISTINCT c.comment_id)
        ) AS activity_score
    FROM accounts_user u
    LEFT JOIN projects_project p ON p.user_id = u.user_id
    LEFT JOIN projects_collaborator col ON col.user_id = u.user_id
    LEFT JOIN projects_issue col_issue ON col_issue.issue_id = col.issue_id
    LEFT JOIN projects_project col_proj ON col_proj.project_id = col_issue.project_id
    LEFT JOIN interactions_like l ON l.user_id = u.user_id
    LEFT JOIN interactions_comment c ON c.user_id = u.user_id
    LEFT JOIN accounts_skill sk ON sk.user_id = u.user_id
    GROUP BY
        u.user_id, u.full_name, u.nu_email, u.avatar_url,
        u.bio, u.github_username, u.is_github_connected, u.created_at
    """,

    # 7. recent_activity_view — unified feed using UNION ALL
    # Note: Like model has no created_at, so only projects and comments are included
    """
    CREATE OR REPLACE VIEW recent_activity_view AS
    SELECT
        'project' AS activity_type,
        p.project_id AS entity_id,
        p.title AS entity_title,
        u.user_id,
        u.full_name,
        u.avatar_url,
        p.created_at AS activity_date
    FROM projects_project p
    JOIN accounts_user u ON p.user_id = u.user_id
    UNION ALL
    SELECT
        'comment' AS activity_type,
        c.comment_id AS entity_id,
        proj.title AS entity_title,
        u.user_id,
        u.full_name,
        u.avatar_url,
        c.created_at AS activity_date
    FROM interactions_comment c
    JOIN accounts_user u ON c.user_id = u.user_id
    JOIN projects_project proj ON c.project_id = proj.project_id
    """,

    # 8. get_user_network_projects — PostgreSQL function for network recommendations
    """
    CREATE OR REPLACE FUNCTION get_user_network_projects(p_user_id INTEGER)
    RETURNS TABLE(project_id INTEGER) AS $$
    BEGIN
        RETURN QUERY
        SELECT DISTINCT p.project_id
        FROM projects_project p
        WHERE p.user_id IN (
            -- Users who collaborated on the same issues as p_user_id
            SELECT DISTINCT col2.user_id
            FROM projects_collaborator col1
            JOIN projects_collaborator col2 ON col1.issue_id = col2.issue_id
            WHERE col1.user_id = p_user_id AND col2.user_id != p_user_id
            UNION
            -- Users who liked the same projects as p_user_id
            SELECT DISTINCT l2.user_id
            FROM interactions_like l1
            JOIN interactions_like l2 ON l1.project_id = l2.project_id
            WHERE l1.user_id = p_user_id AND l2.user_id != p_user_id
        )
        AND p.user_id != p_user_id;
    END;
    $$ LANGUAGE plpgsql
    """,
]

# Reverse SQL — drop in reverse order to respect dependencies
REVERSE_SQL = [
    "DROP FUNCTION IF EXISTS get_user_network_projects(INTEGER)",
    "DROP VIEW IF EXISTS recent_activity_view",
    "DROP VIEW IF EXISTS user_activity_view",
    "DROP VIEW IF EXISTS top_contributors_view",
    "DROP VIEW IF EXISTS projects_needing_help_view",
    "DROP VIEW IF EXISTS trending_projects_view",
    "DROP VIEW IF EXISTS project_tags_flat_view",
    "DROP VIEW IF EXISTS project_summary_view",
]


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0006_collaborator"),
        ("interactions", "0002_like"),
        ("accounts", "0002_skill"),
    ]

    operations = [
        migrations.RunSQL(
            sql=FORWARD_SQL,
            reverse_sql=REVERSE_SQL,
        )
    ]
