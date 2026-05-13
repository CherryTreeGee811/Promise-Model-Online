using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class PermissionsController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly IUserRepository _userRepository;

        public PermissionsController(IPermissionService permissionService,
                                     IUserRepository userRepository)
        {
            _permissionService = permissionService;
            _userRepository = userRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDTO>>> GetPermissions(
            [FromQuery] int projectId)
        {
            var permissions = await _permissionService.GetPermissionsByProjectAsync(projectId);
            return Ok(permissions);
        }

        [HttpPost]
        public async Task<ActionResult<PermissionDTO>> InviteUser(
            [FromBody] CreatePermissionRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                var result = await _permissionService.InviteUserAsync(request, userId.Value);
                return CreatedAtAction(nameof(GetPermissions), new { projectId = request.ProjectId }, result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("accept")]
        public async Task<ActionResult<PermissionDTO>> AcceptInvitation(
            [FromBody] AcceptInvitationRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                var result = await _permissionService.AcceptInvitationAsync(request.PermissionId, userId.Value);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RevokePermission(int id)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId == null) return Unauthorized();

            try
            {
                await _permissionService.RemovePermissionAsync(id, userId.Value);
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private async Task<int?> GetCurrentUserIdByEmailAsync()
        {
            // Debug: log all claims to see what we actually have
            foreach (var claim in User.Claims)
                Console.WriteLine($"Claim: {claim.Type} = {claim.Value}");

            // Try common claim types for email
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value
                    ?? User.FindFirst("emails")?.Value;

            if (string.IsNullOrEmpty(email))
            {
                Console.WriteLine("No email claim found in token.");
                return null;
            }

            Console.WriteLine($"Email resolved: {email}");
            var user = await _userRepository.GetOrCreateUserByEmailAsync(email);
            return user.Id;
        }
    }
}