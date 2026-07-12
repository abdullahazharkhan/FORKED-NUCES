export type ProjectListFilters = {
    issueStatus: string;
    limit: number;
    ordering: string;
    search: string;
    tag: string;
};

export type UserListFilters = {
    limit: number;
    ordering: string;
    search: string;
    skill: string;
};

export const queryKeys = {
    activity: ["activity"] as const,
    recentActivity: (limit: number) =>
        ["activity", "recent", { limit }] as const,
    currentUserStats: ["activity", "stats", "current-user"] as const,
    leaderboard: ["top-contributors"] as const,
    topContributors: (limit: number) =>
        ["top-contributors", { limit }] as const,
    projects: ["projects"] as const,
    projectList: (filters: ProjectListFilters) =>
        ["projects", "list", filters] as const,
    recommendedProjects: ["recommended-projects"] as const,
    recommendedProjectMode: (mode: string, limit = 20) =>
        ["recommended-projects", mode, { limit }] as const,
    myProjects: ["my-projects"] as const,
    project: (projectId: string | number) => ["project", Number(projectId)] as const,
    userProjects: (userId: string | number) => ["user-projects", String(userId)] as const,
    allUserProjects: ["user-projects"] as const,
    userCollaboratedProjects: (userId: string | number) => ["user-collaborated-projects", String(userId)] as const,
    allUserCollaborations: ["user-collaborated-projects"] as const,
    users: ["users"] as const,
    userList: (filters: UserListFilters) => ["users", "list", filters] as const,
    user: (userId: string | number) => ["user", String(userId)] as const,
    projectComments: (projectId: string | number) => ["project-comments", String(projectId)] as const,
    issueCollaborationRequests: (
        issueId: string | number,
        status: string = "all"
    ) => ["issue-collaboration-requests", Number(issueId), { status }] as const,
    projectCollaborators: (projectId: string | number) => ["project-collaborators", Number(projectId)] as const,
};
