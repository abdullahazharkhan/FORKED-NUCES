export const notificationQueryKeys = {
    all: ["notifications"] as const,
    list: (unreadOnly: boolean) =>
        ["notifications", "list", unreadOnly ? "unread" : "all"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
};

export const collaborationQueryKeys = {
    all: ["collaboration-requests"] as const,
    mine: ["collaboration-requests", "mine"] as const,
};

export const reportQueryKeys = {
    all: ["moderation-reports"] as const,
    submitted: ["moderation-reports", "submitted"] as const,
};

