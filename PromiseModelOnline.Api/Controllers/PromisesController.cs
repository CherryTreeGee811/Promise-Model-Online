using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using PromiseModelOnline.Api.BusinessLogic.Interfaces;

using PromiseModelOnline.Api.DAL.Interfaces;

using PromiseModelOnline.Api.DTOs;

using PromiseModelOnline.Api.Mappers.Interfaces;

using PromiseModelOnline.Api.Models;

using System;

using System.Linq;

using System.Threading.Tasks;



namespace PromiseModelOnline.Api.Controllers

{

    /// <summary>REST controller for promise CRUD with effort calculation and description updates.</summary>

    /// <remarks>Route disabled — use <c>ProjectPromisesController</c> instead.</remarks>

    [Route("__disabled__/{controller}")]

    public class PromisesController : GenericController<Promise, PromiseDTO>

    {

        private readonly IMomentService _momentService;

        private readonly IGenericService<Promise> _promiseService;

        private readonly IGenericMapper<Promise, PromiseDTO> _promiseMapper;

        private readonly IPromiseModelOnlineContext _context;



        /// <summary>Initializes a new instance of the <see cref="PromisesController"/> class.</summary>
        /// <param name="service">The generic promise service.</param>
        /// <param name="mapper">The promise mapper.</param>
        /// <param name="momentService">The moment service for effort calculations.</param>
        /// <param name="context">The database context.</param>
        public PromisesController(

            IGenericService<Promise> service,

            IGenericMapper<Promise, PromiseDTO> mapper,

            IMomentService momentService,

            IPromiseModelOnlineContext context)

            : base(service, mapper)

        {

            _momentService = momentService;

            _promiseService = service;

            _promiseMapper = mapper;

            _context = context;

        }



        /// <summary>Create a promise from a DTO with auto-generated sequence number.</summary>
        /// <param name="request">The promise creation data.</param>
        /// <returns>The created promise DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<PromiseDTO>> CreateFromDto([FromBody] CreatePromiseRequestDTO request)

        {

            if (request is null) return BadRequest("Request body is required.");

            if (!ModelState.IsValid) return ValidationProblem(ModelState);



            var nextSeq = await _context.GetNextPromiseSequenceAsync(request.ProjectId);



            var promise = new Promise

            {

                Statement = request.Statement,

                Description = request.Description,

                ProjectId = request.ProjectId,

                SequenceNumber = nextSeq,

                DisplayOrder = request.DisplayOrder,

                StatusColor = "red"

            };



            await _promiseService.AddAsync(promise);

            return CreatedAtAction(nameof(GetById), new { id = promise.Id }, _promiseMapper.Map(promise, _promiseService));

        }



        /// <summary>Get the total effort estimate for all moments under a promise.</summary>
        /// <param name="id">The promise ID.</param>
        /// <returns>The total effort value.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet("{id}/total-effort")]
        public async Task<ActionResult<int>> GetTotalEffort(int id)

        {

            var effort = await _momentService.GetTotalEffortForPromiseAsync(id);

            return Ok(effort);

        }



        [Authorize(Policy = "projects.write")]

        [HttpPatch("{id}/description")]

        /// <param name="request">The request data.</param>
        /// <param name="id">The entity ID.</param>
        public async Task<ActionResult<PromiseDTO>> UpdateDescription(int id, [FromBody] UpdateDescriptionRequestDTO request)

        {

            if (request is null) return BadRequest("Request body is required.");

            if (!ModelState.IsValid) return ValidationProblem(ModelState);



            var promise = await _service.GetByIdAsync(id);

            if (promise is null) return NotFound();



            promise.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

            promise.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(promise);

            return Ok(_promiseMapper.Map(promise, _promiseService));

        }

    }

}
