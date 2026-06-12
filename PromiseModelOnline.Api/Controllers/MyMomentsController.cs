using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace PromiseModelOnline.Api.Controllers
{
    [ApiController]
    [Route("api/moments")]
    public class MyMomentsController : ControllerBase
    {
        private readonly IMomentService _momentService;
        private readonly IGenericMapper<Moment, MomentDTO> _mapper;
        private readonly IUserRepository _userRepository;
        private readonly IPromiseModelOnlineContext _context;

        public MyMomentsController(
            IMomentService momentService,
            IGenericMapper<Moment, MomentDTO> mapper,
            IUserRepository userRepository,
            IPromiseModelOnlineContext context)
        {
            _momentService = momentService;
            _mapper = mapper;
            _userRepository = userRepository;
            _context = context;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("assigned-to-me")]
        public async Task<ActionResult<IEnumerable<MomentDTO>>> GetMyAssignedMoments()
        {
            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var moments = await _momentService.GetMomentsByOwnerIdAsync(user.Id);
            var result = new List<MomentDTO>();
            foreach (var m in moments)
            {
                var dto = _mapper.Map(m, _momentService);
                var projectInfo = await ResolveProjectContextAsync(m.FlowId);
                if (projectInfo is not null)
                {
                    dto.OwnerSlug = projectInfo.Value.OwnerSlug;
                    dto.ProjectSlug = projectInfo.Value.ProjectSlug;
                }
                result.Add(dto);
            }

            return Ok(result);
        }

        private async Task<(string OwnerSlug, string ProjectSlug)?> ResolveProjectContextAsync(int flowId)
        {
            var result = await _context.Flows
                .Where(f => f.Id == flowId)
                .Select(f => new
                {
                    OwnerSlug = f.Journey.Epic.ProductPromise.Project.Owner.Slug,
                    ProjectSlug = f.Journey.Epic.ProductPromise.Project.Slug
                })
                .FirstOrDefaultAsync();

            if (result is null)
                return null;

            return (result.OwnerSlug, result.ProjectSlug);
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }
    }
}
