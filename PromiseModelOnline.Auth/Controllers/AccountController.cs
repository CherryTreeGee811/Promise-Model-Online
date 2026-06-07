using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.Models;
using PromiseModelOnline.Auth.Services;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

[Route("account/register")]
public class AccountController : Controller
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AccountController> _logger;
    private readonly IMemoryCache _cache;

    private const string VerificationCodePrefix = "verify_code:";

    public AccountController(
        UserManager<IdentityUser> userManager,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<AccountController> logger,
        IMemoryCache cache)
    {
        _userManager = userManager;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
    }

    private static string GenerateVerificationCode()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        var val = BitConverter.ToUInt32(bytes) % 1_000_000;
        return val.ToString("D6");
    }

    [AllowAnonymous]
    [HttpGet("")]
    public IActionResult Register()
    {
        ViewBag.HasGoogle = !string.IsNullOrWhiteSpace(
            _configuration["Authentication:Google:ClientId"]);
        return View(new RegisterViewModel());
    }

    [AllowAnonymous]
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    [EnableRateLimiting("RegisterPolicy")]
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
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(string.Empty, error.Description);
            return View(model);
        }

        try
        {
            var code = GenerateVerificationCode();
            _cache.Set(
                $"{VerificationCodePrefix}{user.Id}",
                code,
                new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(24)));
            await _emailService.SendVerificationEmailAsync(model.Email, model.Username, code);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", model.Email);
        }

        return RedirectToAction("Index", "EmailVerification", new { userId = user.Id });
    }
}
