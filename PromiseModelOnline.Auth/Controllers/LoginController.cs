using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Auth.Models;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

[Route("connect/login")]
public class LoginController : Controller
{
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly UserManager<IdentityUser> _userManager;

    public LoginController(SignInManager<IdentityUser> signInManager, UserManager<IdentityUser> userManager)
    {
        _signInManager = signInManager;
        _userManager = userManager;
    }

    [AllowAnonymous]
    [HttpGet("")]
    public IActionResult Index(string? returnUrl)
    {
        if (string.IsNullOrEmpty(returnUrl))
        {
            returnUrl = Request?.Query?["returnUrl"].ToString();
        }

        ViewBag.Registered = (Request?.Query?["registered"].ToString() ?? "") == "true";
        ViewBag.ReturnUrl = returnUrl;
        return View(new LoginViewModel { ReturnUrl = returnUrl });
    }

    [AllowAnonymous]
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Index(LoginViewModel model)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.ReturnUrl = model.ReturnUrl;
            ViewBag.Registered = (Request?.Query?["registered"].ToString() ?? "") == "true";
            return View(model);
        }

        var returnUrl = model.ReturnUrl;
        if (string.IsNullOrEmpty(returnUrl))
        {
            returnUrl = Request?.Query?["returnUrl"].ToString();
        }

        model.ReturnUrl = returnUrl;

        var user = await _userManager.FindByNameAsync(model.Username);
        if (user == null)
        {
            ModelState.AddModelError(string.Empty, "Invalid username or password.");
            ViewBag.ReturnUrl = returnUrl;
            return View(model);
        }

        var result = await _signInManager.PasswordSignInAsync(
            user,
            model.Password,
            isPersistent: false,
            lockoutOnFailure: false
        );

        if (result.Succeeded)
        {
            if (!string.IsNullOrEmpty(returnUrl))
            {
                // FIX: Allow relative URLs OR absolute URLs pointing back to your proxy gateway domain
                if (Url.IsLocalUrl(returnUrl) || returnUrl.StartsWith("/"))
                {
                    return LocalRedirect(returnUrl);
                }

                if (returnUrl.StartsWith("https://localhost:9000", StringComparison.OrdinalIgnoreCase))
                {
                    return Redirect(returnUrl);
                }
            }

            // Fallback if no return URL was found
            return Redirect("/");
        }

        ModelState.AddModelError(string.Empty, "Invalid username or password.");
        ViewBag.ReturnUrl = model.ReturnUrl;
        return View(model);
    }
}