using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OpenIddict.Abstractions;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>MVC controller for the change-password page (GET form, POST submission).</summary>
[Route("account/change-password")]
[Authorize]
public class ChangePasswordPageController : Controller
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IOpenIddictTokenManager _tokenManager;
    private readonly ILogger<ChangePasswordPageController> _logger;

    /// <summary>Initializes the controller with user manager, token manager, and logger.</summary>
    /// <param name="userManager">The Identity user manager for password verification and changes.</param>
    /// <param name="tokenManager">The OpenIddict token manager for revoking refresh tokens after password change.</param>
    /// <param name="logger">The logger for password change audit events.</param>
    public ChangePasswordPageController(
        UserManager<IdentityUser> userManager,
        IOpenIddictTokenManager tokenManager,
        ILogger<ChangePasswordPageController> logger)
    {
        _userManager = userManager;
        _tokenManager = tokenManager;
        _logger = logger;
    }

    /// <summary>Display the change-password form.</summary>
    /// <returns>The change-password view.</returns>
    [HttpGet("")]
    public IActionResult Index()
    {
        ViewBag.Success = false;
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
        ViewBag.Success = false;

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
        {
            _logger.LogWarning("ChangePasswordPage: user not found for Subject {UserId}", userId);
            return Unauthorized();
        }

        var isValid = await _userManager.CheckPasswordAsync(user, currentPassword);
        if (!isValid)
        {
            _logger.LogWarning("ChangePasswordPage: invalid current password for {UserId}", userId);
            ModelState.AddModelError("", "Current password is incorrect.");
            return View("~/Views/ChangePassword/Index.cshtml");
        }

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors.Select(e => e.Description))
            {
                _logger.LogWarning("ChangePasswordPage: failure for {UserId}: {Error}", userId, error);
                ModelState.AddModelError("", error);
            }
            return View("~/Views/ChangePassword/Index.cshtml");
        }

        var tokens = _tokenManager.FindAsync(
            subject: user.Id,
            client: null,
            status: null,
            type: OpenIddictConstants.TokenTypeHints.RefreshToken);

        await foreach (var token in tokens)
            await _tokenManager.TryRevokeAsync(token);

        _logger.LogInformation("ChangePasswordPage: password changed for user {UserId}, tokens revoked", userId);
        ViewBag.Success = true;
        return View("~/Views/ChangePassword/Index.cshtml");
    }
}
