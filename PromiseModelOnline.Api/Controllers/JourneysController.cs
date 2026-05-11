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
    }
}