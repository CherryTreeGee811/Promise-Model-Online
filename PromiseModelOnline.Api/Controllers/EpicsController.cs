using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    public class EpicsController : GenericController<Epic, EpicDTO>
    {
        private readonly IEpicService _epicService;
        private readonly IPromiseModelOnlineContext _context;

        public EpicsController(
            IEpicService service,
            IGenericMapper<Epic, EpicDTO> mapper,
            IPromiseModelOnlineContext context)
            : base(service, mapper)
        {
            _epicService = service;
            _context = context;
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<EpicDTO>> CreateFromDto([FromBody] CreateEpicRequestDTO request)
        {
            if (request is null) return BadRequest("Request is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var nextSeq = await _context.GetNextEpicSequenceAsync(request.ProductPromiseId);

            var epic = new Epic
            {
                Statement = request.Statement,
                Description = request.Description,
                ProductPromiseId = request.ProductPromiseId,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _epicService.AddAsync(epic);
            return CreatedAtAction(nameof(GetById), new { id = epic.Id }, _mapper.Map(epic, _service));
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<EpicDTO>>> GetAll()
        {
            IEnumerable<Epic> epics;

            var promiseIdStr = Request.Query["promiseId"];
            if (!string.IsNullOrEmpty(promiseIdStr) && int.TryParse(promiseIdStr, out int promiseId))
                epics = await _epicService.GetEpicsByPromiseAsync(promiseId);
            else
                epics = await _epicService.GetAllAsync();

            var result = new List<EpicDTO>();
            foreach (var epic in epics)
                result.Add(_mapper.Map(epic, _service));

            return Ok(result);
        }

        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}/description")]
        public async Task<ActionResult<EpicDTO>> UpdateDescription(
            int id,
            [FromBody] UpdateDescriptionRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var epic = await _service.GetByIdAsync(id);
            if (epic is null)
                return NotFound();

            epic.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            epic.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(epic);
            return Ok(_mapper.Map(epic, _service));
        }
    }
}