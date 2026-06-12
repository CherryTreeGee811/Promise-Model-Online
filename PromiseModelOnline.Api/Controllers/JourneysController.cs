using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("__disabled__/{controller}")]
    public class JourneysController : GenericController<Journey, JourneyDTO>
    {
        private readonly IJourneyService _journeyService;
        private readonly IPromiseModelOnlineContext _context;

        public JourneysController(
            IJourneyService service,
            IGenericMapper<Journey, JourneyDTO> mapper,
            IPromiseModelOnlineContext context)
            : base(service, mapper)
        {
            _journeyService = service;
            _context = context;
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<JourneyDTO>> CreateFromDto([FromBody] CreateJourneyRequestDTO request)
        {
            if (request is null) return BadRequest("Request is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var nextSeq = await _context.GetNextJourneySequenceAsync(request.EpicId);

            var journey = new Journey
            {
                Statement = request.Statement,
                Description = request.Description,
                EpicId = request.EpicId,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _journeyService.AddAsync(journey);
            return CreatedAtAction(nameof(GetById), new { id = journey.Id }, _mapper.Map(journey, _service));
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<JourneyDTO>>> GetAll()
        {
            IEnumerable<Journey> journeys;

            var epicIdStr = Request.Query["epicId"];
            if (!string.IsNullOrEmpty(epicIdStr) && int.TryParse(epicIdStr, out int epicId))
                journeys = await _journeyService.GetJourneysByEpicAsync(epicId);
            else
                journeys = await _journeyService.GetAllAsync();

            var result = new List<JourneyDTO>();
            foreach (var j in journeys)
                result.Add(_mapper.Map(j, _service));

            return Ok(result);
        }

        [Authorize(Policy = "projects.write")]
||||||| 1bedf4f
=======
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class JourneysController : GenericController<Journey, JourneyDTO>
    {
        private readonly IJourneyService _journeyService;

        public JourneysController(
            IJourneyService service,
            IGenericMapper<Journey, JourneyDTO> mapper)
            : base(service, mapper)
        {
            _journeyService = service;
        }

        [HttpPost("create")]
        public async Task<ActionResult<JourneyDTO>> CreateFromDto([FromBody] CreateJourneyRequestDTO request)
        {
            if (request is null) return BadRequest("Request is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var journey = new Journey
            {
                Statement = request.Statement,
                Description = request.Description,
                EpicId = request.EpicId,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _journeyService.AddAsync(journey);
            return CreatedAtAction(nameof(GetById), new { id = journey.Id }, _mapper.Map(journey, _service));
        }

        [HttpGet]
        public override async Task<ActionResult<IEnumerable<JourneyDTO>>> GetAll()
        {
            IEnumerable<Journey> journeys;

            var epicIdStr = Request.Query["epicId"];
            if (!string.IsNullOrEmpty(epicIdStr) && int.TryParse(epicIdStr, out int epicId))
                journeys = await _journeyService.GetJourneysByEpicAsync(epicId);
            else
                journeys = await _journeyService.GetAllAsync();

            var result = new List<JourneyDTO>();
            foreach (var j in journeys)
                result.Add(_mapper.Map(j, _service));

            return Ok(result);
        }

>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
        [HttpPatch("{id}/description")]
        public async Task<ActionResult<JourneyDTO>> UpdateDescription(
            int id,
            [FromBody] UpdateDescriptionRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var journey = await _service.GetByIdAsync(id);
            if (journey is null)
                return NotFound();

            journey.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            journey.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(journey);
            return Ok(_mapper.Map(journey, _service));
        }
    }
}