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
<<<<<<< HEAD
    [Route("__disabled__/{controller}")]
    public class IterationsController : GenericController<Iteration, IterationDTO>
    {
        private readonly IIterationService _iterationService;
        private readonly IMomentService _momentService;

        public IterationsController(
            IIterationService service,
            IGenericMapper<Iteration, IterationDTO> mapper,
            IMomentService momentService)
            : base(service, mapper)
        {
            _iterationService = service;
            _momentService = momentService;
        }

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

        [Authorize(Policy = "projects.read")]
||||||| 1bedf4f
=======
    [Authorize]
    [Route("api/[controller]")]
    public class IterationsController : GenericController<Iteration, IterationDTO>
    {
        private readonly IIterationService _iterationService;
        private readonly IMomentService _momentService;

        public IterationsController(
            IIterationService service,
            IGenericMapper<Iteration, IterationDTO> mapper,
            IMomentService momentService)
            : base(service, mapper)
        {
            _iterationService = service;
            _momentService = momentService;
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

>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
        [HttpGet("{id}/burndown")]
        public async Task<ActionResult<List<BurndownPointDTO>>> GetIterationBurndown(int id)
        {
            var points = await _momentService.GetIterationBurndownAsync(id);
            return Ok(points);
        }
    }
}