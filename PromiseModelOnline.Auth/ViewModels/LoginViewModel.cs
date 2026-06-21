using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.ViewModels;

/// <summary>View model for the login form.</summary>
public class LoginViewModel
{
    /// <summary>Username or email. Required.</summary>
    [Required]
    public string Username { get; set; } = string.Empty;

    /// <summary>Account password. Required.</summary>
    [Required]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    /// <summary>Optional URL to redirect to after successful login.</summary>
    public string? ReturnUrl { get; set; }
}
