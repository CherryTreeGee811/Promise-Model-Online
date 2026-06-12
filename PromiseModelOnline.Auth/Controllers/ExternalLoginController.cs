using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PromiseModelOnline.Auth.Controllers;

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
                new { returnUrl, error = "We could not retrieve your email from the external provider. Please ensure your Google account has a verified email address." });
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

    private RedirectResult RedirectToBff(string returnUrl)
    {
        var safeReturnUrl = Url.IsLocalUrl(returnUrl) ? returnUrl : "/";
        return Redirect($"/login?returnUrl={Uri.EscapeDataString(safeReturnUrl)}");
    }
}
