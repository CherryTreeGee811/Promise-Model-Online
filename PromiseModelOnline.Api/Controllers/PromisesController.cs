using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class PromisesController : GenericController<Promise, PromiseDTO>
    {
        private readonly IMomentService _momentService;

        public PromisesController(
            IGenericService<Promise> service,
            IGenericMapper<Promise, PromiseDTO> mapper,
            IMomentService momentService)
            : base(service, mapper)
        {
            _momentService = momentService;
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
    }
}