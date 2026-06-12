using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Auth.ViewModels;

public class VerifyEmailViewModel
{
    public string Email { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Verification code is required.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be 6 digits.")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Verification code must be 6 digits.")]
    public string Code { get; set; } = string.Empty;
}
