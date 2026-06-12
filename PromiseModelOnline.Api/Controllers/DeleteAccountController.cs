using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/users/me")]
    [ApiController]
    [Authorize]
    public class DeleteAccountController : ControllerBase
    {
        private readonly IAuthClient _authClient;

        public DeleteAccountController(IAuthClient authClient)
        {
            _authClient = authClient;
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
        {
            try
            {
                var authorizationHeader = Request.Headers["Authorization"].ToString();
                await _authClient.DeleteAccountAsync(request, authorizationHeader);
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Unauthorized");
            }
            catch (ArgumentException)
            {
                return BadRequest("Bad request");
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
