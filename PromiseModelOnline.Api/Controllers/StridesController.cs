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
    public class StridesController : GenericController<Stride, StrideDTO>
    {
        private readonly IStrideService _strideService;

        public StridesController(
            IStrideService service,
            IGenericMapper<Stride, StrideDTO> mapper)
            : base(service, mapper)
        {
            _strideService = service;
        }

        [HttpGet]
        public override async Task<ActionResult<IEnumerable<StrideDTO>>> GetAll()
        {
            IEnumerable<Stride> strides;

            var iterationIdStr = Request.Query["iterationId"];
            if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
                strides = await _strideService.GetStridesByIterationAsync(iterationId);
            else
                strides = await _strideService.GetAllAsync();

            var result = new List<StrideDTO>();
            foreach (var stride in strides)
                result.Add(_mapper.Map(stride, _service));

            return Ok(result);
        }
    }
}