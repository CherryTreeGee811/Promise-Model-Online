using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/[controller]")]
    public class ProjectsController : GenericController<Project, ProjectDTO>
    {
        public ProjectsController(IGenericService<Project> service, IGenericMapper<Project, ProjectDTO> mapper)
            : base(service, mapper) { }
    }
}