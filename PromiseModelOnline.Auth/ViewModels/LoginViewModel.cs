using System.ComponentModel.DataAnnotations;
using PromiseModelOnline.Auth.Attributes;

namespace PromiseModelOnline.Auth.ViewModels;

/// <summary>View model for the login form.</summary>
public class LoginViewModel
{
    /// <summary>Username or email. Required.</summary>
    [Required]
    [StringLength(254)]
    public string Username { get; set; } = string.Empty;

    /// <summary>Account password. Required.</summary>
    [Required]
    [DataType(DataType.Password)]
    [StringLength(128)]
    public string Password { get; set; } = string.Empty;

    /// <summary>Optional URL to redirect to after successful login.</summary>
    [DoNotSanitize]
    public string? ReturnUrl { get; set; }
}
