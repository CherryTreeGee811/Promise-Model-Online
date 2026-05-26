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
    }
}