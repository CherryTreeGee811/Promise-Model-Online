using System.Linq;
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

/// <summary>Handles user registration (GET form display, POST account creation with email verification).</summary>
[Route("account/register")]
public class AccountController : Controller
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AccountController> _logger;
    private readonly IMemoryCache _cache;

    private const string VerificationCodePrefix = "verify_code:";

        /// <summary>Initializes the controller with Identity, email, configuration, logging, and caching dependencies.</summary>
        /// <param name="userManager">The Identity user manager for account creation and lookups.</param>
        /// <param name="emailService">The email service for sending verification codes.</param>
        /// <param name="configuration">The application configuration for external provider settings.</param>
        /// <param name="logger">The logger for registration and verification events.</param>
        /// <param name="cache">The memory cache for storing verification codes.</param>
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

    /// <summary>Generate a cryptographically random 6-digit verification code.</summary>
    private static string GenerateVerificationCode()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        var val = BitConverter.ToUInt32(bytes) % 1_000_000;
        return val.ToString("D6");
    }

    /// <summary>Display the registration form with optional Google login button.</summary>
    [AllowAnonymous]
    [HttpGet("")]
    public IActionResult Register()
    {
        ViewBag.HasGoogle = !string.IsNullOrWhiteSpace(
            _configuration["Authentication:Google:ClientId"]);
        return View(new RegisterViewModel());
    }

        /// <summary>Process registration: validate, create user, send verification email, redirect to verify page.</summary>
        /// <param name="model">The registration form data.</param>
        /// <returns>A redirect or the registration view with errors.</returns>
        [AllowAnonymous]
        [HttpPost("")]
        [EnableRateLimiting("Email")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
    {
        ViewBag.HasGoogle = !string.IsNullOrWhiteSpace(
            _configuration["Authentication:Google:ClientId"]);

        if (!ModelState.IsValid)
            return View(model);

        var user = new IdentityUser
        {
            UserName = model.Username,
            Email = model.Email,
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
        {
            var code = GenerateVerificationCode();
            var cacheKey = $"{VerificationCodePrefix}{user.Id}";
            _cache.Set(cacheKey, code, TimeSpan.FromHours(24));

            await _emailService.SendVerificationEmailAsync(model.Email, model.Username, code);

            _logger.LogInformation("User {Email} registered. Verification code cached.", model.Email);
            return RedirectToAction("Index", "EmailVerification",
                new { userId = user.Id });
        }

        foreach (var error in result.Errors.Select(e => e.Description))
        {
            _logger.LogWarning("Registration failed for {Email}: {Error}", model.Email, error);
            ModelState.AddModelError("", error);
        }

        return View(model);
    }

        /// <summary>Display the email verification form.</summary>
        /// <param name="email">The email address to verify.</param>
        /// <param name="userId">The user ID for the verification.</param>
        /// <returns>A redirect to login or the verification view with errors.</returns>
        [AllowAnonymous]
        [HttpGet("verify-email")]
        public IActionResult VerifyEmail(string email, string userId)
    {
        ViewBag.Email = email;
        ViewBag.UserId = userId;
        return View(new VerifyEmailViewModel
        {
            Email = email,
            UserId = userId
        });
    }

        /// <summary>Process email verification: validate code against cached value and confirm the user.</summary>
        /// <param name="model">The verification form data.</param>
        /// <returns>A redirect to login or the verification view with errors.</returns>
        [AllowAnonymous]
        [HttpPost("verify-email")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyEmail(VerifyEmailViewModel model)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.Email = model.Email;
            ViewBag.UserId = model.UserId;
            return View(model);
        }

        var cacheKey = $"{VerificationCodePrefix}{model.UserId}";
        if (!_cache.TryGetValue(cacheKey, out string? cachedCode) || cachedCode != model.Code)
        {
            ModelState.AddModelError("Code", "Invalid or expired verification code. Request a new one.");
            ViewBag.Email = model.Email;
            ViewBag.UserId = model.UserId;
            return View(model);
        }

        var user = await _userManager.FindByIdAsync(model.UserId);
        if (user == null)
        {
            return RedirectToAction("Register");
        }

        user.EmailConfirmed = true;
        await _userManager.UpdateAsync(user);
        _cache.Remove(cacheKey);

        _logger.LogInformation("User {Email} verified email successfully.", model.Email);
        return Redirect($"/account/login?registered=true&verified=true");
    }

        /// <summary>Resend the verification code to the user's email.</summary>
        /// <param name="email">The email address to resend the code to.</param>
        /// <param name="userId">The user ID for the verification.</param>
        /// <returns>A redirect back to the verification page.</returns>
        [AllowAnonymous]
        [HttpPost("resend-code")]
        [EnableRateLimiting("Email")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResendCode(string email, string userId)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(userId))
            return BadRequest();

        var code = GenerateVerificationCode();
        var cacheKey = $"{VerificationCodePrefix}{userId}";
        _cache.Set(cacheKey, code, TimeSpan.FromHours(24));

        var user = await _userManager.FindByIdAsync(userId);
        var username = user?.UserName ?? "User";

        await _emailService.SendVerificationEmailAsync(email, username, code);
        _logger.LogInformation("Verification code resent to {Email}", email);

        return RedirectToAction("VerifyEmail", new { email, userId });
    }
}
