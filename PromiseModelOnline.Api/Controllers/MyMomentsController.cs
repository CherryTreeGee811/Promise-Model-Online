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
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for retrieving moments assigned to the current user.</summary>
    /// <remarks>
    ///   Resolves the current user from JWT claims and returns their assigned moments with
    ///   project context (owner slug and project slug) for URL construction.
    ///   Requires <c>projects.read</c> policy.
    /// </remarks>
    [ApiController]
    [Route("api/moments")]
    public class MyMomentsController : ControllerBase
    {
        private readonly IMomentService _momentService;
        private readonly IGenericMapper<Moment, MomentDTO> _mapper;
        private readonly IUserRepository _userRepository;
        private readonly IPromiseModelOnlineContext _context;
        private readonly ILogger<MyMomentsController> _logger;

        /// <summary>Initializes the controller with required services and repositories.</summary>
        /// <param name="momentService">The moment service.</param>
        /// <param name="mapper">The mapper.</param>
        /// <param name="userRepository">The user repository.</param>
        /// <param name="context">The database context.</param>
        /// <param name="logger">The logger for audit and error events.</param>
        public MyMomentsController(
            IMomentService momentService,
            IGenericMapper<Moment, MomentDTO> mapper,
            IUserRepository userRepository,
            IPromiseModelOnlineContext context,
            ILogger<MyMomentsController> logger)
        {
            _momentService = momentService;
            _mapper = mapper;
            _userRepository = userRepository;
            _context = context;
            _logger = logger;
        }

        /// <summary>Return moments assigned to the current user, with project slug context.</summary>
        [Authorize(Policy = "projects.read")]
        [HttpGet("assigned-to-me")]
        public async Task<ActionResult<IEnumerable<MomentDTO>>> GetMyAssignedMoments()
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

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

        /// <summary>Resolve owner and project slugs from a flow ID for URL construction.</summary>
        /// <param name="flowId">The flow ID to resolve.</param>
        /// <returns>A tuple of owner slug and project slug, or <c>null</c> if not found.</returns>
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

            if (result is null) return null;
            return (result.OwnerSlug, result.ProjectSlug);
        }

        /// <summary>Resolve the current user from JWT claims.</summary>
        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;
            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }
    }
}
