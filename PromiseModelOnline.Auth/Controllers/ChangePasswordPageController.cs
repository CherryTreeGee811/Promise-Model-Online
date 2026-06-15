using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>MVC controller for the change-password page (GET form, POST submission).</summary>
[Route("account/change-password")]
[Authorize]
public class ChangePasswordPageController : Controller
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IOpenIddictTokenManager _tokenManager;

    /// <summary>Initializes the controller with user manager and token manager.</summary>
    /// <param name="userManager">The Identity user manager.</param>
    /// <param name="tokenManager">The OpenIddict token manager for revoking refresh tokens.</param>
    public ChangePasswordPageController(
        UserManager<IdentityUser> userManager,
        IOpenIddictTokenManager tokenManager)
    {
        _userManager = userManager;
        _tokenManager = tokenManager;
    }

    /// <summary>Display the change-password form.</summary>
    /// <returns>The change-password view.</returns>
    [HttpGet("")]
    public IActionResult Index()
    {
        return View("~/Views/ChangePassword/Index.cshtml");
    }

    /// <summary>Process password change form: validate, verify current password, update, revoke refresh tokens.</summary>
    /// <param name="currentPassword">The user's current password for verification.</param>
    /// <param name="newPassword">The desired new password.</param>
    /// <param name="confirmPassword">Confirmation of the new password.</param>
    /// <returns>The change-password view with success flag or validation errors.</returns>
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ChangePassword(string? currentPassword, string? newPassword, string? confirmPassword)
    {
        if (string.IsNullOrWhiteSpace(currentPassword) ||
            string.IsNullOrWhiteSpace(newPassword) ||
            string.IsNullOrWhiteSpace(confirmPassword))
        {
            ModelState.AddModelError("", "All fields are required.");
            return View("~/Views/ChangePassword/Index.cshtml");
        }

        if (newPassword != confirmPassword)
        {
            ModelState.AddModelError("", "New password and confirmation must match.");
            return View("~/Views/ChangePassword/Index.cshtml");
        }

        var userId = User.FindFirst(OpenIddictConstants.Claims.Subject)?.Value
                     ?? _userManager.GetUserId(User);

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Unauthorized();

        var isValid = await _userManager.CheckPasswordAsync(user, currentPassword);
        if (!isValid)
        {
            ModelState.AddModelError("", "Current password is incorrect.");
            return View("~/Views/ChangePassword/Index.cshtml");
        }

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError("", error.Description);
            return View("~/Views/ChangePassword/Index.cshtml");
        }

        var tokens = _tokenManager.FindAsync(
            subject: user.Id,
            client: null,
            status: null,
            type: OpenIddictConstants.TokenTypeHints.RefreshToken);

        await foreach (var token in tokens)
            await _tokenManager.TryRevokeAsync(token);

        ViewBag.Success = true;
        return View("~/Views/ChangePassword/Index.cshtml");
    }
}
