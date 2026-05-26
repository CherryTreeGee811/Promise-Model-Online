using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Auth.Models;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

[Route("connect/register")]
public class AccountController : Controller
{
    private readonly UserManager<IdentityUser> _userManager;

    public AccountController(UserManager<IdentityUser> userManager)
    {
        _userManager = userManager;
    }

    [AllowAnonymous]
    [HttpGet("")]
    public IActionResult Register()
    {
        return View(new RegisterViewModel());
    }

    [AllowAnonymous]
    [HttpPost("")]
    [ValidateAntiForgeryToken] 
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        var existingUser = await _userManager.FindByNameAsync(model.Username);
        if (existingUser != null)
        {
            ModelState.AddModelError(nameof(model.Username), "Username is already taken.");
            return View(model);
        }

        var existingEmail = await _userManager.FindByEmailAsync(model.Email);
        if (existingEmail != null)
        {
            ModelState.AddModelError(nameof(model.Email), "An account with this email already exists.");
            return View(model);
        }

        var user = new IdentityUser
        {
            UserName = model.Username,
            Email = model.Email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(string.Empty, error.Description);
            return View(model);
        }

        var returnUrl = Request?.Query["returnUrl"].ToString();

        if (!string.IsNullOrEmpty(returnUrl))
        {
            return LocalRedirect(returnUrl + "&registered=true");
        }

        return Redirect("/connect/login");
    }
}