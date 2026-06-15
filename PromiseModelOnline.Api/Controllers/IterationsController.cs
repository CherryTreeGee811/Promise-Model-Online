using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for iteration CRUD with burndown chart support.</summary>
    /// <remarks>
    ///   Route is disabled via <c>__disabled__</c> prefix; use <c>ProjectIterationsController</c> instead.
    ///   Provides filtered <c>GetAll</c> by <c>projectId</c> query parameter and burndown data endpoint.
    /// </remarks>
    [Route("__disabled__/{controller}")]
    public class IterationsController : GenericController<Iteration, IterationDTO>
    {
        private readonly IIterationService _iterationService;
        private readonly IMomentService _momentService;

        /// <summary>Initializes the controller with required services.</summary>
        public IterationsController(
            IIterationService service,
            IGenericMapper<Iteration, IterationDTO> mapper,
            IMomentService momentService)
            : base(service, mapper)
        {
            _iterationService = service;
            _momentService = momentService;
        }

        /// <summary>Retrieve all iterations, optionally filtered by project ID.</summary>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<IterationDTO>>> GetAll()
        {
            IEnumerable<Iteration> iterations;

            var projectIdStr = Request.Query["projectId"];
            if (!string.IsNullOrEmpty(projectIdStr) && int.TryParse(projectIdStr, out int projectId))
                iterations = await _iterationService.GetIterationsByProjectAsync(projectId);
            else
                iterations = await _iterationService.GetAllAsync();

            var result = new List<IterationDTO>();
            foreach (var iter in iterations)
                result.Add(_mapper.Map(iter, _service));

            return Ok(result);
        }

        /// <summary>Get burndown chart data points for an iteration.</summary>
        /// <param name="id">The iteration ID.</param>
        /// <response code="200">Returns burndown data points ordered by date.</response>
        [Authorize(Policy = "projects.read")]
        [HttpGet("{id}/burndown")]
        public async Task<ActionResult<List<BurndownPointDTO>>> GetIterationBurndown(int id)
        {
            var points = await _momentService.GetIterationBurndownAsync(id);
            return Ok(points);
        }
    }
}
