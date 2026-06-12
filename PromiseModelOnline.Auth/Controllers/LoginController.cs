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

    [AllowAnonymous]
    [HttpGet("")]
    public IActionResult Index(string? returnUrl, string? error = null)
    {
        if (string.IsNullOrEmpty(returnUrl))
        {
            returnUrl = Request?.Query?["returnUrl"].ToString();
        }

        ViewBag.Registered = (Request?.Query?["registered"].ToString() ?? "") == "true";
        ViewBag.Verified = (Request?.Query?["verified"].ToString() ?? "") == "true";
        ViewBag.Error = error ?? Request?.Query?["error"].ToString();
        ViewBag.ReturnUrl = returnUrl;
        ViewBag.HasGoogle = !string.IsNullOrWhiteSpace(
            _configuration["Authentication:Google:ClientId"]);
        return View(new LoginViewModel { ReturnUrl = returnUrl });
    }

    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid)
            return View("Index", model);

        // Uses PasswordSignInAsync with lockoutOnFailure: true so that
        // Identity's lockout mechanism (5 failed attempts → 5 min lockout)
        // is enforced. Returns LockedOut result when the account is locked.
        var result = await _signInManager.PasswordSignInAsync(
            model.Username, model.Password,
            isPersistent: false, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            ModelState.AddModelError("", "Account is locked. Try again later.");
            return View("Index", model);
        }

        if (!result.Succeeded)
        {
            ModelState.AddModelError("", "Invalid credentials");
            return View("Index", model);
        }

        var user = await _userManager.FindByNameAsync(model.Username);

        if (user != null && !await _userManager.IsEmailConfirmedAsync(user))
        {
            await _signInManager.SignOutAsync();
            ModelState.AddModelError("", "Please verify your email address before signing in.");
            return View("Index", model);
        }

        var returnUrl = model.ReturnUrl;

        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
        {
            return Redirect(returnUrl);
        }

        return Redirect("/login");
    }
}