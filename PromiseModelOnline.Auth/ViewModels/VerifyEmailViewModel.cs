using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.ViewModels;

/// <summary>View model for the email verification form.</summary>
public class VerifyEmailViewModel
{
    /// <summary>Email address to verify (display-only when re-rendering the form).</summary>
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    /// <summary>User ID associated with the verification.</summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>6-digit verification code. Required, must match pattern <c>\d{6}</c>.</summary>
    [Required(ErrorMessage = "Verification code is required.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be 6 digits.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Verification code must be 6 digits.")]
    public string Code { get; set; } = string.Empty;
}
