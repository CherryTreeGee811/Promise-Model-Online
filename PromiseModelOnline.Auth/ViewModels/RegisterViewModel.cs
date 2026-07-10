using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.ViewModels;

/// <summary>View model for the registration form.</summary>
public class RegisterViewModel
{
    /// <summary>Desired display name. Required.</summary>
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Username { get; set; } = string.Empty;

    /// <summary>Email address. Required, must be valid format.</summary>
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    /// <summary>Desired password. Required.</summary>
    [Required]
    [DataType(DataType.Password)]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    /// <summary>Password confirmation. Must match <see cref="Password"/>. Required.</summary>
    [Required]
    [DataType(DataType.Password)]
    [StringLength(128, MinimumLength = 8)]
    [Compare("Password", ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>Consent to the Privacy Policy and Terms of Service. Required.</summary>
    [Required(ErrorMessage = "You must agree to the Privacy Policy and Terms of Service.")]
    [Range(typeof(bool), "true", "true", ErrorMessage = "You must agree to the Privacy Policy and Terms of Service.")]
    public bool PrivacyConsent { get; set; }
}
