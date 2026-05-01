using PromiseModelOnline.Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PromiseModelOnline.Auth.Controllers
{
    [ApiController]
    [Route("auth/")]
    public class LoginController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly UserManager<IdentityUser> _userManager;

        public LoginController(IConfiguration config, UserManager<IdentityUser> userManager)
        {
            _config = config;
            _userManager = userManager;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLogin userLogin)
        {
            if (string.IsNullOrEmpty(userLogin?.UserName))
            {
                return BadRequest("Username cannot be null or empty.");
            }

            if (string.IsNullOrEmpty(userLogin?.Password))
            {
                return BadRequest("Password cannot be null or empty.");
            }

            var user = await _userManager.FindByNameAsync(userLogin.UserName);
            if (user != null && await _userManager.CheckPasswordAsync(user, userLogin.Password))
            {
                var token = Generate(user);
                return Ok(new { token });
            }

            return Unauthorized("Invalid username or password");
        }

        private string Generate(IdentityUser user)
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
    }
}