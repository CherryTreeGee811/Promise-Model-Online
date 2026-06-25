using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

[AllowAnonymous]
/// <summary>Handles the password-reset flow: token validation and new password submission.</summary>
/// <remarks>
///   Users arrive at this controller via the reset link sent by <see cref="ForgotPasswordController"/>.
///   The token and email are passed as query-string parameters on the GET request.
/// </remarks>
/// <param name="userManager">ASP.NET Identity user manager for token validation and password update.</param>
/// <param name="logger">Serilog logger for password-reset audit events.</param>
[Route("account/reset-password")]
public class ResetPasswordController(
    UserManager<IdentityUser> userManager,
    ILogger<ResetPasswordController> logger) : Controller
{
    private readonly UserManager<IdentityUser> _userManager = userManager;
    private readonly ILogger<ResetPasswordController> _logger = logger;

    /// <summary>Display the reset-password form pre-populated with the email and token from the reset link.</summary>
    /// <remarks>If either the email or token parameter is missing, an error view is shown instead.</remarks>
    /// <param name="email">The user's email address from the reset link.</param>
    /// <param name="token">The password-reset token from the reset link.</param>
    /// <returns>The reset-password view or an error view if the link is invalid.</returns>
    [HttpGet("")]
    public IActionResult Index(string? email, string? token)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
            return View("Error");

        return View(new ResetPasswordViewModel
        {
            Email = email,
            Token = token
        });
    }

    /// <summary>Validate the reset token and set the user's new password.</summary>
    /// <remarks>
    ///   On success the user is redirected to a confirmation page. On failure the form is re-displayed
    ///   with validation errors (e.g. expired token, weak password, token reuse).
    /// </remarks>
    /// <param name="model">The form data containing email, token, new password, and confirmation.</param>
    /// <returns>A success confirmation view or the reset form with validation errors.</returns>
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Reset(ResetPasswordViewModel model)
    {
        if (!ModelState.IsValid)
            return View("Index", model);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user is null)
        {
            ModelState.AddModelError("", "Invalid password reset request.");
            return View("Index", model);
        }

        var result = await _userManager.ResetPasswordAsync(user, model.Token, model.Password);
        if (result.Succeeded)
        {
            _logger.LogInformation("Password reset successful for {Email}", model.Email);
            return View("Success");
        }

        foreach (var error in result.Errors.Select(e => e.Description))
            ModelState.AddModelError("", error);

        return View("Index", model);
    }
}
