using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;

namespace PromiseModelOnline.Auth.Controllers;

[Route("account/change-password")]
[Authorize]
public class ChangePasswordPageController : Controller
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IOpenIddictTokenManager _tokenManager;

    public ChangePasswordPageController(
        UserManager<IdentityUser> userManager,
        IOpenIddictTokenManager tokenManager)
    {
        _userManager = userManager;
        _tokenManager = tokenManager;
    }

    [HttpGet("")]
    public IActionResult Index()
    {
        return View("~/Views/ChangePassword/Index.cshtml");
    }

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
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Unauthorized();
        }

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
            {
                ModelState.AddModelError("", error.Description);
            }
            return View("~/Views/ChangePassword/Index.cshtml");
        }

        // Revoke all existing refresh tokens for this user
        var tokens = _tokenManager.FindAsync(
            subject: user.Id,
            client: null,
            status: null,
            type: OpenIddictConstants.TokenTypeHints.RefreshToken);

        await foreach (var token in tokens)
        {
            await _tokenManager.TryRevokeAsync(token);
        }

        ViewBag.Success = true;
        return View("~/Views/ChangePassword/Index.cshtml");
    }
}
