using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.ViewModels;

/// <summary>View model for the registration form.</summary>
public class RegisterViewModel
{
    /// <summary>Desired display name. Required.</summary>
    [Required]
    public string Username { get; set; } = string.Empty;

    /// <summary>Email address. Required, must be valid format.</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Desired password. Required.</summary>
    [Required]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    /// <summary>Password confirmation. Must match <see cref="Password"/>. Required.</summary>
    [Required]
    [DataType(DataType.Password)]
    [Compare("Password", ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>Consent to the Privacy Policy and Terms of Service. Required.</summary>
    [Required(ErrorMessage = "You must agree to the Privacy Policy and Terms of Service.")]
    [Range(typeof(bool), "true", "true", ErrorMessage = "You must agree to the Privacy Policy and Terms of Service.")]
    public bool PrivacyConsent { get; set; }
}
