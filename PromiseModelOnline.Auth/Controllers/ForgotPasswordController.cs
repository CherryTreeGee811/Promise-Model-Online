using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Auth.Services;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Controllers;

[AllowAnonymous]
/// <summary>Handles the forgot-password flow: email submission and reset-link dispatch.</summary>
/// <remarks>Always reports success regardless of whether the email is known, to prevent email enumeration.</remarks>
/// <param name="userManager">ASP.NET Identity user manager for lookup and token generation.</param>
/// <param name="emailService">Transactional email service for sending the reset link.</param>
/// <param name="logger">Serilog logger for password-reset audit events.</param>
/// <param name="env">The hosting environment for environment-specific behavior.</param>
[Route("account/forgot-password")]
public class ForgotPasswordController(
    UserManager<IdentityUser> userManager,
    IEmailService emailService,
    ILogger<ForgotPasswordController> logger,
    IWebHostEnvironment env) : Controller
{
    private readonly UserManager<IdentityUser> _userManager = userManager;
    private readonly IEmailService _emailService = emailService;
    private readonly ILogger<ForgotPasswordController> _logger = logger;
    private readonly IWebHostEnvironment _env = env;

    /// <summary>Display the forgot-password form where users enter their email address.</summary>
    /// <returns>The forgot-password view.</returns>
    [HttpGet("")]
    public IActionResult Index() => View();

    /// <summary>Process the forgot-password form: look up the user, generate a reset token, and send the reset link email.</summary>
    /// <remarks>
    ///   Always returns the same success view to prevent email enumeration attacks.
    ///   Reset links expire after 1 hour (token lifetime controlled by Identity's default token lifespan).
    /// </remarks>
    /// <param name="model">The form data containing the user's email address.</param>
    /// <returns>The forgot-password view with a success message or validation errors.</returns>
    [HttpPost("")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SendResetLink(ForgotPasswordViewModel model)
    {
        if (!ModelState.IsValid)
            return View("Index", model);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user is null || !(await _userManager.IsEmailConfirmedAsync(user)))
        {
            ViewBag.Sent = true;
            return View("Index", model);
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var resetLink = Url.Action("Index", "ResetPassword",
            new { email = model.Email, token = encodedToken },
            Request.Scheme);

        if (resetLink is null)
        {
            _logger.LogError("Failed to generate reset link for {Email}", model.Email);
            ModelState.AddModelError("", "An error occurred. Please try again.");
            return View("Index", model);
        }

        await _emailService.SendResetPasswordEmailAsync(model.Email, user.UserName ?? model.Email, resetLink);

        _logger.LogInformation("Password reset email sent to {Email}", model.Email);
        ViewBag.Sent = true;
        return View("Index", model);
    }

    /// <summary>Debug endpoint: generate a password-reset token for a confirmed user (Development only).</summary>
    [AllowAnonymous]
    [HttpGet("debug/token")]
    public async Task<IActionResult> GetResetToken(string? email)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { error = "Email is required" });

        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
            return NotFound(new { error = "User not found" });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        return Ok(new { email, token });
    }
}
