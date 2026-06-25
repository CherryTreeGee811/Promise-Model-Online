using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>MVC controller for viewing and editing the authenticated user's profile.</summary>
/// <remarks>
///   Currently supports updating the display name (<see cref="IdentityUser.UserName"/>).
///   Email changes are intentionally excluded because they require re-verification
///   and are handled through the account management flow when needed.
/// </remarks>
/// <param name="userManager">ASP.NET Identity user manager for profile updates.</param>
/// <param name="logger">Serilog logger for profile audit events.</param>
[Route("account/me/profile")]
[Authorize]
public class ProfileController(
    UserManager<IdentityUser> userManager,
    ILogger<ProfileController> logger) : Controller
{
    private readonly UserManager<IdentityUser> _userManager = userManager;
    private readonly ILogger<ProfileController> _logger = logger;

    /// <summary>Display the profile form pre-populated with the current user's display name and email.</summary>
    /// <returns>The profile view with the current user's data.</returns>
    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Challenge();

        return View(new ProfileViewModel
        {
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            EmailConfirmed = user.EmailConfirmed
        });
    }

    /// <summary>Update the authenticated user's display name.</summary>
    /// <remarks>
    ///   Validates uniqueness of the requested username before saving.
    ///   Only the <see cref="ProfileViewModel.Username"/> field is mutable through this endpoint.
    /// </remarks>
    /// <param name="model">The form data containing the updated display name.</param>
    /// <returns>The profile view with a success message or validation errors.</returns>
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Update(ProfileViewModel model)
    {
        if (!ModelState.IsValid)
            return View("Index", model);

        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Challenge();

        if (model.Username != user.UserName)
        {
            var existingUser = await _userManager.FindByNameAsync(model.Username);
            if (existingUser is not null && existingUser.Id != user.Id)
            {
                ModelState.AddModelError(nameof(model.Username), "This display name is already taken.");
                return View("Index", model);
            }

            user.UserName = model.Username;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                foreach (var error in result.Errors.Select(e => e.Description))
                    ModelState.AddModelError("", error);
                return View("Index", model);
            }

            _logger.LogInformation("User {UserId} updated display name to {Username}",
                user.Id, model.Username);
        }

        ViewBag.Updated = true;
        return View("Index", model);
    }
}
