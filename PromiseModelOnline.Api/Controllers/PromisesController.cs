using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/[controller]")]
    public class PromisesController : GenericController<Promise, PromiseDTO>
    {
        public PromisesController(IGenericService<Promise> service, IGenericMapper<Promise, PromiseDTO> mapper)
            : base(service, mapper) { }
    }
}