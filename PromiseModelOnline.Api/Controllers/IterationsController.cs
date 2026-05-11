using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class IterationsController : GenericController<Iteration, IterationDTO>
    {
        private readonly IIterationService _iterationService;

        public IterationsController(
            IIterationService service,
            IGenericMapper<Iteration, IterationDTO> mapper)
            : base(service, mapper)
        {
            _iterationService = service;
        }

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
    }
}