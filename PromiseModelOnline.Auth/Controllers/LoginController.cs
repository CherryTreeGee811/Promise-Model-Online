using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Auth.Models;
using PromiseModelOnline.Auth.ViewModels;
using PromiseModelOnline.Auth.Common;
using System.Security.Claims;
using OpenIddict.Abstractions;
using Microsoft.AspNetCore.Authentication;
using OpenIddict.Server.AspNetCore;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>Handles local login (username/password) with lockout and email-verified enforcement.</summary>
[Route("account/login")]
public class LoginController : Controller
{
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IConfiguration _configuration;

    public LoginController(
        SignInManager<IdentityUser> signInManager,
        UserManager<IdentityUser> userManager,
        IConfiguration configuration)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _configuration = configuration;
    }

    /// <summary>Display the login form with optional status messages.</summary>
    /// <param name="returnUrl">Optional URL to redirect to after successful login.</param>
    /// <param name="error">Optional error message to display.</param>
    /// <returns>The login view.</returns>
    [AllowAnonymous]
    [HttpGet("")]
    public IActionResult Index(string? returnUrl, string? error = null)
    {
        if (string.IsNullOrEmpty(returnUrl))
            returnUrl = Request?.Query?["returnUrl"].ToString();

        ViewBag.Registered = (Request?.Query?["registered"].ToString() ?? "") == "true";
        ViewBag.Verified = (Request?.Query?["verified"].ToString() ?? "") == "true";
        ViewBag.Error = error ?? Request?.Query?["error"].ToString();
        ViewBag.ReturnUrl = returnUrl;
        ViewBag.HasGoogle = !string.IsNullOrWhiteSpace(
            _configuration["Authentication:Google:ClientId"]);
        return View(new LoginViewModel { ReturnUrl = returnUrl });
    }

    /// <summary>Authenticate the user with email verification and lockout enforcement.</summary>
    /// <param name="model">The login form data containing username and password.</param>
    /// <returns>Redirects to the return URL on success, or returns the login view with errors.</returns>
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Index(LoginViewModel model)
    {
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
            ModelState.AddModelError("", "Invalid username or password.");
            return View(model);
        }

        if (!await _userManager.IsEmailConfirmedAsync(user))
        {
            return RedirectToAction("VerifyEmail", "Account",
                new { email = user.Email, userId = user.Id });
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            ModelState.AddModelError("", "Account locked. Try again later.");
            return View(model);
        }

        var signInResult = await _signInManager.PasswordSignInAsync(
            user, model.Password, isPersistent: true, lockoutOnFailure: true);

        if (signInResult.Succeeded)
        {
            if (!string.IsNullOrEmpty(model.ReturnUrl))
                return Redirect(model.ReturnUrl);
            return Redirect($"{AppUrls.BaseUrl}/projects");
        }

        if (signInResult.IsLockedOut)
        {
            ModelState.AddModelError("", "Account locked. Try again later.");
            return View(model);
        }

        ModelState.AddModelError("", "Invalid username or password.");
        return View(model);
    }
}
