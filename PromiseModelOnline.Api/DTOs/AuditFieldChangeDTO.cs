namespace PromiseModelOnline.Api.DTOs;

public class AuditFieldChangeDTO
{
    public string FieldName { get; set; } = string.Empty;

    public object? Before { get; set; }

    public object? After { get; set; }
}