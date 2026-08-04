using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Auth.Models;
using PromiseModelOnline.Auth.ViewModels;
using PromiseModelOnline.Auth.Attributes;
using PromiseModelOnline.Auth.Common;
using System.Security.Claims;
using OpenIddict.Abstractions;
using Microsoft.AspNetCore.Authentication;
using OpenIddict.Server.AspNetCore;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>Handles local login (username/password) with lockout and email-verified enforcement.</summary>
/// <remarks>Initializes the controller with sign-in, user, configuration, and logging dependencies.</remarks>
/// <param name="signInManager">The Identity sign-in manager for password authentication.</param>
/// <param name="userManager">The Identity user manager for user lookups and lockout checks.</param>
/// <param name="configuration">The application configuration for external provider settings.</param>
/// <param name="logger">The logger for login audit events.</param>
[Route("account/login")]
public class LoginController(
    SignInManager<IdentityUser> signInManager,
    UserManager<IdentityUser> userManager,
    IConfiguration configuration,
    ILogger<LoginController> logger) : Controller
{
    private readonly SignInManager<IdentityUser> _signInManager = signInManager;
    private readonly UserManager<IdentityUser> _userManager = userManager;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<LoginController> _logger = logger;

    /// <summary>Display the login form with optional status messages.</summary>
    /// <param name="returnUrl">Optional URL to redirect to after successful login.</param>
    /// <param name="error">Optional error message to display.</param>
    /// <param name="registered">Whether the user just registered.</param>
    /// <param name="verified">Whether the user just verified their email.</param>
    /// <returns>The login view.</returns>
    [AllowAnonymous]
    [HttpGet("")]
    public IActionResult Index([DoNotSanitize] string? returnUrl, string? error = null,
        [FromQuery] bool registered = false, [FromQuery] bool verified = false)
    {
        if (!ModelState.IsValid)
            return View(new LoginViewModel { ReturnUrl = returnUrl });

        ViewBag.Registered = registered;
        ViewBag.Verified = verified;
        ViewBag.Error = error;
        ViewBag.ReturnUrl = returnUrl;
        ViewBag.HasGoogle = !string.IsNullOrWhiteSpace(
            _configuration["Authentication:Google:ClientId"]);
        return View(new LoginViewModel { ReturnUrl = returnUrl });
    }

    /// <summary>Authenticate the user with email verification and lockout enforcement.</summary>
    /// <param name="model">The login form data containing username and password.</param>
    /// <returns>Redirects to the return URL on success, or returns the login view with errors.</returns>
    [AllowAnonymous]
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Index(LoginViewModel model)
    {
        ViewBag.Registered = false;
        ViewBag.Verified = false;
        ViewBag.HasGoogle = !string.IsNullOrWhiteSpace(
            _configuration["Authentication:Google:ClientId"]);

        if (!ModelState.IsValid)
            return View(model);

        if (string.IsNullOrWhiteSpace(model.Username))
        {
            ModelState.AddModelError("", "Username is required.");
            return View(model);
        }

        var user = await _userManager.FindByNameAsync(model.Username)
                   ?? await _userManager.FindByEmailAsync(model.Username);

        if (user == null)
        {
            _logger.LogWarning("Login: unknown user {Username}", model.Username);
            ModelState.AddModelError("", "Invalid username or password.");
            return View(model);
        }

        if (!await _userManager.IsEmailConfirmedAsync(user))
        {
            _logger.LogWarning("Login: email not confirmed for {Username}", model.Username);
            return RedirectToAction("VerifyEmail", "Account",
                new { email = user.Email, userId = user.Id });
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            _logger.LogWarning("Login: account locked for {Username}", model.Username);
            ModelState.AddModelError("", "Account locked. Try again later.");
            return View(model);
        }

        var signInResult = await _signInManager.PasswordSignInAsync(
            user, model.Password, isPersistent: true, lockoutOnFailure: true);

        if (signInResult.Succeeded)
        {
            _logger.LogInformation("Login: user {Username} authenticated successfully", model.Username);
            if (!string.IsNullOrEmpty(model.ReturnUrl) && Url.IsLocalUrl(model.ReturnUrl))
                return Redirect(model.ReturnUrl);
            return Redirect($"{AppUrls.BaseUrl}/projects");
        }

        if (signInResult.IsLockedOut)
        {
            _logger.LogWarning("Login: user {Username} locked out after failed attempt", model.Username);
            ModelState.AddModelError("", "Account locked. Try again later.");
            return View(model);
        }

        _logger.LogWarning("Login: invalid password for {Username}", model.Username);
        ModelState.AddModelError("", "Invalid username or password.");
        return View(model);
    }
}
