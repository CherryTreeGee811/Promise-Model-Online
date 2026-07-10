using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.Models;

/// <summary>Request DTO for the email verification confirmation endpoint.
/// Contains only the fields submitted by the form — Email is derived server-side from UserId.</summary>
public class ConfirmEmailRequest
{
    /// <summary>User ID associated with the verification.</summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>6-digit verification code. Required, must match pattern <c>\d{6}</c>.</summary>
    [Required(ErrorMessage = "Verification code is required.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be 6 digits.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Verification code must be 6 digits.")]
    public string Code { get; set; } = string.Empty;
}
