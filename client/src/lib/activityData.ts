import { z } from "zod";

const positiveId = z.number().int().positive();
const count = z.number().int().nonnegative();

const topContributorSchema = z.object({
    activity_score: count,
    avatar_url: z.string().nullable(),
    comments_made: count,
    full_name: z.string(),
    issues_collaborated: count,
    nu_email: z.string(),
    projects_created: count,
    rank: positiveId,
    user_id: positiveId,
});

const userActivityStatsSchema = z.object({
    activity_score: count,
    avatar_url: z.string().nullable(),
    bio: z.string().nullable(),
    comments_made: count,
    full_name: z.string(),
    github_username: z.string().nullable(),
    is_github_connected: z.boolean(),
    issues_collaborated: count,
    likes_given: count,
    member_since: z.string(),
    nu_email: z.string(),
    projects_collaborated: count,
    projects_created: count,
    skill_count: count,
    user_id: positiveId,
});

const recentActivitySchema = z.object({
    activity_date: z.string(),
    activity_type: z.enum(["project", "comment"]),
    avatar_url: z.string().nullable(),
    entity_id: positiveId,
    entity_title: z.string(),
    full_name: z.string(),
    user_id: positiveId,
});

const topContributorsSchema = z.array(topContributorSchema);
const recentActivitiesSchema = z.array(recentActivitySchema);

export type TopContributor = z.infer<typeof topContributorSchema>;
export type UserActivityStats = z.infer<typeof userActivityStatsSchema>;
export type RecentActivity = z.infer<typeof recentActivitySchema>;

function parseResponse<T>(
    schema: z.ZodType<T>,
    value: unknown,
    message: string
): T {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new Error(message);
    return parsed.data;
}

export function parseTopContributors(value: unknown): TopContributor[] {
    return parseResponse(
        topContributorsSchema,
        value,
        "The leaderboard service returned an invalid response."
    );
}

export function parseUserActivityStats(value: unknown): UserActivityStats {
    return parseResponse(
        userActivityStatsSchema,
        value,
        "The user statistics service returned an invalid response."
    );
}

export function parseRecentActivities(value: unknown): RecentActivity[] {
    return parseResponse(
        recentActivitiesSchema,
        value,
        "The activity service returned an invalid response."
    );
}

export function userProfilePath(userId: number): string {
    return `/platform/users/${encodeURIComponent(String(userId))}`;
}

export function projectActivityPath(activity: RecentActivity): string | null {
    return activity.activity_type === "project"
        ? `/platform/projects/${encodeURIComponent(String(activity.entity_id))}`
        : null;
}
