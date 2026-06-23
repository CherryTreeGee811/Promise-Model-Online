namespace PromiseModelOnline.Api.Enums;

/// <summary>Describes the type of change recorded in an audit event.</summary>
/// <remarks>
///   Used by the audit logging system in <c>PromiseModelOnlineContext</c> to classify tracked
///   entity changes. <c>StatusChanged</c> is a special case for <c>Moment</c> status transitions.
/// </remarks>
public enum AuditActionType
{
    /// <summary>A new entity was created.</summary>
    Created,
    /// <summary>An existing entity was modified.</summary>
    Updated,
    /// <summary>An entity was deleted.</summary>
    Deleted,
    /// <summary>A moment's status property was changed (special case of Updated).</summary>
    StatusChanged
}
