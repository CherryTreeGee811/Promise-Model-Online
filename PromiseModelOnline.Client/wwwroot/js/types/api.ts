/**
 * @typedef {{ id: number; name: string; email?: string }} UserDto
 */

/**
 * @typedef {{ id: number; name: string; description?: string; ownerName: string; ownerSlug: string; slug: string; createdAt: string }} ProjectDto
 */

/**
 * @typedef {{ id: number; user: UserDto; permission: string }} PermissionDto
 */

/**
 * @typedef {{ permission: string | undefined; isOwner: boolean }} PermissionResultDto
 */

/**
 * @typedef {{ entityType: string; sequenceNumber: number; id: number; statusColor?: string }} EntityMapEntryDto
 */

/**
 * @typedef {{ id: number; sequenceNumber: number; statement: string; description?: string; statusColor?: string; productProjectId: number; createdAt: string; updatedAt?: string }} PromiseDto
 */

/**
 * @typedef {{ id: number; sequenceNumber: number; statement: string; description?: string; statusColor?: string; createdAt: string; updatedAt?: string; productPromiseId: number }} EpicDto
 */

/**
 * @typedef {{ id: number; sequenceNumber: number; statement: string; description?: string; statusColor?: string; createdAt: string; updatedAt?: string; productEpicId: number }} JourneyDto
 */

/**
 * @typedef {{ id: number; sequenceNumber: number; statement: string; description?: string; statusColor?: string; createdAt: string; updatedAt?: string; productJourneyId: number }} FlowDto
 */

/**
 * @typedef {{ id: number; sequenceNumber: number; statement: string; description?: string; statusColor?: string; effort?: number; effortUnit?: string; createdAt: string; updatedAt?: string; productFlowId: number }} MomentDto
 */

/**
 * @typedef {{ id: number; name: string; startDate?: string; endDate?: string }} IterationDto
 */

/**
 * @typedef {{ id: number; name: string; iterationId?: number; startDate?: string; endDate?: string; durationDays?: number; isActive?: boolean }} StrideDto
 */

/**
 * @typedef {{ id: number; action: string; entityType: string; entityId: number; userName: string; timestamp: string; details?: string }} AuditEventDto
 */

/**
 * @template T
 * @typedef {{ items: T[]; totalCount: number }} PaginatedResult
 */

/**
 * @typedef {{ id: string; nodeType: 'promise' | 'epic' | 'journey' | 'flow' | 'moment'; label: string; payload: Record<string, unknown>; childCount: number; completedChildCount: number; children: GraphNodeDto[]; _searchText: string; _statusBucket: string; _effortBucket: string | null; _strideBucket: string | null }} GraphNodeDto
 */

/**
 * @typedef {{ id: number; type: string; message: string; isRead: boolean; createdAt: string; relatedEntityType?: string; relatedEntityId?: number }} NotificationDto
 */

/**
 * @typedef {{ id: number; projectName: string; projectOwner: string; permissionLevel: string; createdAt: string }} InvitationDto
 */

/**
 * @typedef {{ id: number; text: string; userName: string; userId: number; createdAt: string; parentType: string; parentId: number }} CommentDto
 */

/**
 * @typedef {{ id: number; emote: string; userName: string; count: number }} ReactionDto
 */

export {}
