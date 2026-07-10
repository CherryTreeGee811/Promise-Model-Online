using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.ViewModels;

/// <summary>Form data for the forgot-password page: email address of the account to recover.</summary>
public class ForgotPasswordViewModel
{
    /// <summary>The email address associated with the user's account. Required, must be a valid email format.</summary>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;
}
