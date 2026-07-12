export type CollaborationKind = "application" | "invitation";
export type CollaborationStatus =
    | "pending"
    | "accepted"
    | "rejected"
    | "withdrawn"
    | "cancelled";
export type CollaborationAction = "accept" | "reject" | "withdraw" | "cancel";
export type CollaborationDirection = "incoming" | "outgoing";

export type CollaborationRoleData = {
    created_by_user_id: number;
    kind: CollaborationKind;
    project_owner_id: number;
    status: CollaborationStatus;
    user_id: number;
};

const actionableStatuses = new Set<CollaborationStatus>([
    "pending",
    "accepted",
]);

export function getCollaborationDirection(
    request: CollaborationRoleData,
    currentUserId: number
): CollaborationDirection {
    return request.created_by_user_id === currentUserId
        ? "outgoing"
        : "incoming";
}

export function getCollaborationActions(
    request: CollaborationRoleData,
    currentUserId: number
): CollaborationAction[] {
    if (!actionableStatuses.has(request.status)) {
        return [];
    }

    const decisionMakerId =
        request.kind === "application"
            ? request.project_owner_id
            : request.user_id;

    if (request.status === "pending" && currentUserId === decisionMakerId) {
        return ["accept", "reject"];
    }

    if (currentUserId === request.user_id) return ["withdraw"];
    if (currentUserId === request.project_owner_id) return ["cancel"];
    return [];
}
