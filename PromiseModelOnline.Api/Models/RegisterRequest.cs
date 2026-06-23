using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.Models;

/// <summary>DTO for user registration requests.</summary>
/// <remarks>
///   Used by the authentication endpoint to create a new user account. All fields are required.
/// </remarks>
public class RegisterRequest
{
    /// <summary>Desired display name.</summary>
    [Required]
    public string UserName { get; set; } = string.Empty;

    /// <summary>Email address.</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Password (will be hashed before storage).</summary>
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
