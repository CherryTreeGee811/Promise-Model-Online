
namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Data Transfer Object for Promise entity, used for API responses.
/// </summary>
public class PromiseDTO
{
    /// <summary>
    /// Gets or sets the unique identifier of the promise.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the main statement or title of the promise.
    /// </summary>
    public string Statement { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the description of the promise.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the display order for UI sorting.
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Gets or sets the status color for the promise (e.g., red, yellow, green).
    /// </summary>
    public string StatusColor { get; set; } = "red";
}