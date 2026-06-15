using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>Tracks the next available sequence number for human-readable entity numbering within a scoped parent.</summary>
/// <remarks>
///   Used by <c>PromiseModelOnlineContext</c> for atomic sequence allocation. Each entity type
///   (Promise, Epic, Journey, Flow, Moment) has its own sequence scoped to its parent entity.
///   For example, promises are numbered within a project, epics within a promise, etc.
///   Composite primary key: (<see cref="ParentId"/>, <see cref="Scope"/>).
/// </remarks>
public class EntitySequence
{
    /// <summary>Parent entity ID that scopes the sequence (part of composite key).</summary>
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int ParentId { get; set; }

    /// <summary>Scope name, typically the entity type (e.g., <c>"Promise"</c>, <c>"Epic"</c>). Part of composite key. Max 50 characters.</summary>
    [Key]
    [MaxLength(50)]
    public string Scope { get; set; } = null!;

    /// <summary>The next sequence number to allocate. Starts at 1.</summary>
    public int NextSequenceNumber { get; set; } = 1;
}
