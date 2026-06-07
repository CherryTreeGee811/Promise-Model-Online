using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.Services;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

[Route("account/verify-email")]
public class EmailVerificationController : Controller
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailVerificationController> _logger;
    private readonly IMemoryCache _cache;

    private const string VerificationCodePrefix = "verify_code:";

    public EmailVerificationController(
        UserManager<IdentityUser> userManager,
        IEmailService emailService,
        ILogger<EmailVerificationController> logger,
        IMemoryCache cache)
    {
        _userManager = userManager;
        _emailService = emailService;
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
    public async Task<IActionResult> Index(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return Redirect("/account/login");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Redirect("/account/login");

        if (await _userManager.IsEmailConfirmedAsync(user))
            return RedirectToAction("Index", "Login", new { verified = "true" });

        ViewBag.Resent = (Request?.Query?["resent"].ToString() ?? "") == "true";
        return View(new VerifyEmailViewModel
        {
            Email = user.Email ?? "",
            UserId = user.Id
        });
    }

    [AllowAnonymous]
    [HttpPost("confirm")]
    [ValidateAntiForgeryToken]
    [EnableRateLimiting("VerifyCodePolicy")]
    public async Task<IActionResult> Confirm(VerifyEmailViewModel model)
    {
        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(model.UserId))
        {
            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
                return Redirect("/account/login");
            model.Email = user.Email ?? "";
            return View("Index", model);
        }

        var user2 = await _userManager.FindByIdAsync(model.UserId);
        if (user2 == null)
            return Redirect("/account/login");

        if (await _userManager.IsEmailConfirmedAsync(user2))
            return RedirectToAction("Index", "Login", new { verified = "true" });

        var cacheKey = $"{VerificationCodePrefix}{user2.Id}";
        if (!_cache.TryGetValue(cacheKey, out string? storedCode) || storedCode != model.Code)
        {
            ModelState.AddModelError(nameof(model.Code), "Invalid or expired verification code. Request a new one below.");
            model.Email = user2.Email ?? "";
            return View("Index", model);
        }

        _cache.Remove(cacheKey);

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user2);
        var result = await _userManager.ConfirmEmailAsync(user2, token);

        if (result.Succeeded)
        {
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

    [AllowAnonymous]
    [HttpPost("resend")]
    [ValidateAntiForgeryToken]
    [EnableRateLimiting("ResendVerificationPolicy")]
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
