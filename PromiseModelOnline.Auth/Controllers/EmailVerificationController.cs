using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using PromiseModelOnline.Auth.Models;
using PromiseModelOnline.Auth.Services;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

/// <summary>Handles email verification flow: confirm code, resend code, verification page.</summary>
/// <remarks>Initializes the controller with user manager, email service, logger, and cache.</remarks>
/// <param name="userManager">The Identity user manager for user lookups.</param>
/// <param name="emailService">The email service for sending verification codes.</param>
/// <param name="logger">The logger for verification audit events.</param>
/// <param name="cache">The memory cache for storing verification codes.</param>
/// <param name="env">The hosting environment for environment-specific behavior.</param>
[Route("account/verify-email")]
public class EmailVerificationController(
    UserManager<IdentityUser> userManager,
    IEmailService emailService,
    ILogger<EmailVerificationController> logger,
    IMemoryCache cache,
    IWebHostEnvironment env) : Controller
{
    private readonly UserManager<IdentityUser> _userManager = userManager;
    private readonly IEmailService _emailService = emailService;
    private readonly ILogger<EmailVerificationController> _logger = logger;
    private readonly IMemoryCache _cache = cache;
    private readonly IWebHostEnvironment _env = env;

    private const string VerificationCodePrefix = "verify_code:";

    /// <summary>Generate a cryptographically random 6-digit verification code.</summary>
    private static string GenerateVerificationCode()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        var val = BitConverter.ToUInt32(bytes) % 1_000_000;
        return val.ToString("D6");
    }

    /// <summary>Display the email verification page for a given user.</summary>
    /// <param name="userId">The user ID to verify.</param>
    /// <param name="resent">Optional flag indicating the verification email was re-sent.</param>
    /// <returns>The verification view, or a redirect to login if the user is not found or already verified.</returns>
    [AllowAnonymous]
    [HttpGet("")]
    public async Task<IActionResult> Index(string? userId, [FromQuery] string? resent)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return Redirect("/account/login");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Redirect("/account/login");

        if (await _userManager.IsEmailConfirmedAsync(user))
            return RedirectToAction("Index", "Login", new { verified = "true" });

        ViewBag.Resent = resent == "true";
        return View(new VerifyEmailViewModel
        {
            Email = user.Email ?? "",
            UserId = user.Id
        });
    }

    /// <summary>Debug endpoint: retrieve the cached verification code for a user.</summary>
    /// <remarks>Only available when ASPNETCORE_ENVIRONMENT is Development. Returns the
    /// 6-digit code cached during registration, enabling E2E tests to complete the
    /// verification flow without reading the email.</remarks>
    /// <param name="userId">The user's GUID.</param>
    /// <returns>The cached verification code or 404.</returns>
    [AllowAnonymous]
    [HttpGet("debug/code/{userId:guid}")]
    public IActionResult GetVerificationCode(Guid userId)
    {
        if (!ModelState.IsValid)
            return NotFound();

        if (!_env.IsDevelopment())
            return NotFound();

        var cacheKey = $"{VerificationCodePrefix}{userId}";
        if (!_cache.TryGetValue(cacheKey, out string? code) || code == null)
            return NotFound();

        return Ok(new { userId, code });
    }

    /// <summary>Validate the verification code from cache and confirm the user's email.</summary>
    /// <param name="request">The verification request containing user ID and 6-digit code.</param>
    /// <returns>A redirect to the login page on success, or the verification view with errors.</returns>
    [AllowAnonymous]
    [HttpPost("confirm")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Confirm([FromForm] ConfirmEmailRequest request)
    {
        ViewBag.Resent = false;

        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request.UserId))
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return Redirect("/account/login");
            return View("Index", new VerifyEmailViewModel { Email = user.Email ?? "", UserId = request.UserId });
        }

        var user2 = await _userManager.FindByIdAsync(request.UserId);
        if (user2 == null) return Redirect("/account/login");

        if (await _userManager.IsEmailConfirmedAsync(user2))
            return RedirectToAction("Index", "Login", new { verified = "true" });

        var cacheKey = $"{VerificationCodePrefix}{user2.Id}";
        if (!_cache.TryGetValue(cacheKey, out string? storedCode) || storedCode != request.Code)
        {
            ModelState.AddModelError(nameof(request.Code), "Invalid or expired verification code. Request a new one below.");
            return View("Index", new VerifyEmailViewModel { Email = user2.Email ?? "", UserId = request.UserId });
        }

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user2);
        var result = await _userManager.ConfirmEmailAsync(user2, token);

        if (result.Succeeded)
        {
            _cache.Remove(cacheKey);
            _logger.LogInformation("Email confirmed for user {UserId}", user2.Id);
            return RedirectToAction("Index", "Login", new { verified = "true" });
        }

        _logger.LogWarning("Email confirmation failed for user {UserId}: {Errors}",
            user2.Id, string.Join(", ", result.Errors.Select(e => e.Description)));

        return RedirectToAction("Index", "Login", new
        {
            error = "Email verification failed. Please try registering again."
        });
    }

    /// <summary>Generate and send a new verification code via email.</summary>
    /// <param name="userId">The user ID.</param>
    /// <returns>A redirect to the verification page or login.</returns>
    [AllowAnonymous]
    [HttpPost("resend")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Resend(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return Redirect("/account/login");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Redirect("/account/login");

        if (await _userManager.IsEmailConfirmedAsync(user))
            return RedirectToAction("Index", "Login", new { verified = "true" });

        try
        {
            var code = GenerateVerificationCode();
            _cache.Set(
                $"{VerificationCodePrefix}{user.Id}",
                code,
                new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(24)));

            var username = user.UserName ?? user.Email ?? "there";
            await _emailService.SendVerificationEmailAsync(user.Email!, username, code);

            _logger.LogInformation("Resent verification email to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resend verification email to {Email}", user.Email);
        }

        return RedirectToAction("Index", "EmailVerification", new { userId, resent = "true" });
    }
}
