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
    public class EpicsController : GenericController<Epic, EpicDTO>
    {
        private readonly IEpicService _epicService;

        public EpicsController(
            IEpicService service,
            IGenericMapper<Epic, EpicDTO> mapper)
            : base(service, mapper)
        {
            _epicService = service;
        }

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
    }
}