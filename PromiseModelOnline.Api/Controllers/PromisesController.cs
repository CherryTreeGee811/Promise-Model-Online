using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class PromisesController : GenericController<Promise, PromiseDTO>
    {
        private readonly IMomentService _momentService;
        private readonly IGenericService<Promise> _promiseService;
        private readonly IGenericMapper<Promise, PromiseDTO> _promiseMapper;

        public PromisesController(
            IGenericService<Promise> service,
            IGenericMapper<Promise, PromiseDTO> mapper,
            IMomentService momentService)
            : base(service, mapper)
        {
            _momentService = momentService;
            _promiseService = service;
            _promiseMapper = mapper;
        }

        [HttpPost("create")]
        public async Task<ActionResult<PromiseDTO>> CreateFromDto([FromBody] CreatePromiseRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var promise = new Promise
            {
                Statement = request.Statement,
                Description = request.Description,
                ProjectId = request.ProjectId,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red",
            };

            await _promiseService.AddAsync(promise);
            return CreatedAtAction(nameof(GetById), new { id = promise.Id }, _promiseMapper.Map(promise, _promiseService));
        }

        /// <summary>
        /// Returns the total numeric effort for all moments under a given promise.
        /// </summary>
        [HttpGet("{id}/total-effort")]
        public async Task<ActionResult<int>> GetTotalEffort(int id)
        {
            var effort = await _momentService.GetTotalEffortForPromiseAsync(id);
            return Ok(effort);
        }

        [HttpPatch("{id}/description")]
        public async Task<ActionResult<PromiseDTO>> UpdateDescription(
            int id,
            [FromBody] UpdateDescriptionRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var promise = await _service.GetByIdAsync(id);
            if (promise is null)
                return NotFound();

            promise.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            promise.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(promise);
            return Ok(_promiseMapper.Map(promise, _promiseService));
        }
    }
}