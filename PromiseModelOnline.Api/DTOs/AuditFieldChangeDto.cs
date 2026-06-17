namespace PromiseModelOnline.Api.DTOs;

/// <summary>A single changed field within an audit timeline entry.</summary>
public class AuditFieldChangeDto
{
    /// <summary>The name of the property that changed.</summary>
    public string FieldName { get; set; } = string.Empty;

    /// <summary>The value before the change, or <c>null</c> for newly added entities.</summary>
    public object? Before { get; set; }

    /// <summary>The value after the change, or <c>null</c> for deleted entities.</summary>
    public object? After { get; set; }
}
