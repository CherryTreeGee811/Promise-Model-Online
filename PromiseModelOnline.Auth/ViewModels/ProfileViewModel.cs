using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.ViewModels;

/// <summary>Form data for the profile page: display name and read-only email with verification status.</summary>
/// <remarks>
///   Only the <see cref="Username"/> field is editable through this view model.
///   Email changes require re-verification and are intentionally excluded from this form.
/// </remarks>
public class ProfileViewModel
{
    /// <summary>The user's display name. Required, maximum 50 characters.</summary>
    [Required(ErrorMessage = "Display name is required.")]
    [StringLength(50, ErrorMessage = "Display name must be at most 50 characters.")]
    public string Username { get; set; } = string.Empty;

    /// <summary>The user's email address. Read-only on the profile form. Required, must be a valid email format.</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Indicates whether the user's email has been verified. Read-only.</summary>
    public bool? EmailConfirmed { get; set; }
}
