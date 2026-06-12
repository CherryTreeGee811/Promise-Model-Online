<<<<<<< HEAD
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
||||||| 1bedf4f
=======
using PromiseModelOnline.Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using PromiseModelOnline.Auth.DAL;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace PromiseModelOnline.Auth.Controllers
{
    [ApiController]
    [Route("api")]
    public class LoginController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly AuthorizationDbContext _dbContext;

        public LoginController(IConfiguration config, UserManager<IdentityUser> userManager, AuthorizationDbContext dbContext)
        {
            _config = config;
            _userManager = userManager;
            _dbContext = dbContext;
        }

        [AllowAnonymous]
        [HttpPost("sessions")]
        public async Task<IActionResult> Login([FromBody] UserLogin userLogin)
        {
            if (string.IsNullOrEmpty(userLogin?.UserName) || string.IsNullOrEmpty(userLogin?.Password))
            {
                return BadRequest("Username and password are required.");
            }

            var user = await _userManager.FindByNameAsync(userLogin.UserName);
            if (user != null && await _userManager.CheckPasswordAsync(user, userLogin.Password))
            {
                var accessToken = GenerateJwt(user);
                var refreshToken = GenerateRefreshToken();

                var refreshTokenEntity = new RefreshToken
                {
                    Token = refreshToken,
                    UserId = user.Id,
                    Created = DateTime.UtcNow,
                    Expires = DateTime.UtcNow.AddDays(30),
                    IsRevoked = false
                };

                _dbContext.RefreshTokens.Add(refreshTokenEntity);
                await _dbContext.SaveChangesAsync();

                var response = new TokenResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken
                };

                return Ok(response);
            }

            return Unauthorized("Invalid username or password");
        }

        [AllowAnonymous]
        [HttpPost("access-tokens")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.RefreshToken))
            {
                return BadRequest("Refresh token required.");
            }

            var rt = await _dbContext.RefreshTokens.FirstOrDefaultAsync(r => r.Token == request.RefreshToken);
            if (rt == null || rt.IsRevoked || rt.Expires < DateTime.UtcNow)
            {
                return Unauthorized("Invalid or expired refresh token.");
            }

            rt.IsRevoked = true;

            var user = await _userManager.FindByIdAsync(rt.UserId);
            if (user == null)
            {
                return Unauthorized("Invalid refresh token.");
            }

            var newAccessToken = GenerateJwt(user);
            var newRefreshToken = GenerateRefreshToken();

            var newRt = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddDays(30),
                IsRevoked = false
            };

            _dbContext.RefreshTokens.Add(newRt);
            await _dbContext.SaveChangesAsync();

            var response = new TokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            };

            return Ok(response);
        }

        private string GenerateJwt(IdentityUser user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = _config["JwtSettings:Key"];

            if (string.IsNullOrEmpty(key))
            {
                throw new InvalidOperationException("JWT key is not configured properly.");
            }

            var keyBytes = Encoding.UTF8.GetBytes(key);

            var claims = new List<Claim>();

            if (!string.IsNullOrEmpty(user.UserName))
            {
                claims.Add(new Claim(ClaimTypes.NameIdentifier, user.UserName));
            }

            if (!string.IsNullOrEmpty(user.Email))
            {
                claims.Add(new Claim(ClaimTypes.Email, user.Email));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = _config["JwtSettings:Issuer"],
                Audience = _config["JwtSettings:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256),
            };

            var jwt = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(jwt);
        }

        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}