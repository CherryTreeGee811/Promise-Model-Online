using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>Handles external (Google) login: challenge, callback, and account linking.</summary>
[Route("account/external")]
public class ExternalLoginController : Controller
{
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly ILogger<ExternalLoginController> _logger;

    public ExternalLoginController(
        SignInManager<IdentityUser> signInManager,
        UserManager<IdentityUser> userManager,
        ILogger<ExternalLoginController> logger)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>Initiate an external authentication challenge (e.g., Google OAuth).</summary>
    /// <param name="provider">The external authentication provider name (e.g., <c>"Google"</c>).</param>
    /// <param name="returnUrl">The URL to return to after authentication.</param>
    /// <response code="302">Redirects to the external provider's login page.</response>
    [AllowAnonymous]
    [HttpPost("challenge")]
    [ValidateAntiForgeryToken]
    public IActionResult Challenge(string provider, string returnUrl)
    {
        if (string.IsNullOrWhiteSpace(provider))
            return BadRequest();

        var redirectUrl = Url.Action("Callback", "ExternalLogin", new { returnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
        return Challenge(properties, provider);
    }

    /// <summary>Process the external login callback: sign in existing users or create a new account.</summary>
    /// <param name="returnUrl">The URL to return to after successful login.</param>
    /// <param name="remoteError">Error returned by the external provider, if any.</param>
    /// <response code="302">Redirects to the BFF login endpoint or shows an error page.</response>
    /// <returns>A redirect to the BFF login endpoint or an error page.</returns>
    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback(string? returnUrl = null, string? remoteError = null)
    {
        returnUrl ??= Url.Content("~/");

        if (remoteError != null)
        {
            _logger.LogError("External auth error from provider: {Error}", remoteError);
            return RedirectToAction("Index", "Login",
                new { returnUrl, error = "Authentication failed. Please try again." });
        }

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
        {
            _logger.LogWarning("External login info is null — possible cookie or state timeout");
            return RedirectToAction("Index", "Login",
                new { returnUrl, error = "An error occurred while processing the external login." });
        }

        var result = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey, isPersistent: false);

        if (result.Succeeded)
        {
            _logger.LogInformation("User logged in via {Provider}", info.LoginProvider);
            return RedirectToBff(returnUrl);
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogWarning("External auth did not provide an email claim");
            return RedirectToAction("Index", "Login",
                new { returnUrl, error = "We could not retrieve your email from the external provider." });
        }

        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            user = new IdentityUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                _logger.LogError("Failed to create user from external login: {Errors}",
                    string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return RedirectToAction("Index", "Login",
                    new { returnUrl, error = "An error occurred while creating your account." });
            }

            _logger.LogInformation("Created account {UserId} from external provider {Provider}",
                user.Id, info.LoginProvider);
        }

        var addLoginResult = await _userManager.AddLoginAsync(user, info);
        if (!addLoginResult.Succeeded)
        {
            _logger.LogError("Failed to link external login to user {UserId}: {Errors}",
                user.Id, string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
            return RedirectToAction("Index", "Login",
                new { returnUrl, error = "An error occurred while linking your account." });
        }

        await _signInManager.SignInAsync(user, isPersistent: false);
        _logger.LogInformation("User {UserId} signed in via {Provider}", user.Id, info.LoginProvider);

        return RedirectToBff(returnUrl);
    }

    /// <summary>Redirect to the BFF login endpoint with the original return URL.</summary>
    /// <param name="returnUrl">The URL to redirect to after login.</param>
    /// <returns>A redirect result to the BFF login endpoint.</returns>
    private RedirectResult RedirectToBff(string returnUrl)
    {
        var safeReturnUrl = Url.IsLocalUrl(returnUrl) ? returnUrl : "/";
        return Redirect($"/login?returnUrl={Uri.EscapeDataString(safeReturnUrl)}");
    }
}
