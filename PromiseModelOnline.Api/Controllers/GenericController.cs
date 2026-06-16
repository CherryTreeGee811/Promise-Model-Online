using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>Generic RESTful controller for basic CRUD operations.</summary>
    /// <remarks>
    ///   Provides standard <c>GET</c>, <c>GET /{id}</c>, <c>POST</c>, <c>PUT /{id}</c>, and <c>DELETE /{id}</c>
    ///   endpoints. Maps between entity types (<typeparamref name="TEntity"/>) and DTO types
    ///   (<typeparamref name="TDto"/>). Derived controllers can override virtual methods for
    ///   custom behavior.
    /// </remarks>
    /// <typeparam name="TEntity">The entity type.</typeparam>
    /// <typeparam name="TDto">The DTO type for transport.</typeparam>
    [ApiController]
    public abstract class GenericController<TEntity, TDto> : ControllerBase
        where TEntity : class
        where TDto : class
    {
        /// <summary>The generic service for business logic and data access.</summary>
        protected readonly IGenericService<TEntity> _service;

        /// <summary>The generic mapper for mapping entities to DTOs.</summary>
        protected readonly IGenericMapper<TEntity, TDto> _mapper;
        /// <summary>Initializes the controller with service and mapper.</summary>
        /// <param name="service">The generic service instance.</param>
        /// <param name="mapper">The generic mapper instance.</param>
        public GenericController(IGenericService<TEntity> service, IGenericMapper<TEntity, TDto> mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        /// <summary>Retrieve all entities.</summary>
        /// <response code="200">Returns the list of all entities as DTOs.</response>
        /// <returns>A list of DTOs representing all entities.</returns>
        [HttpGet]
        public virtual async Task<ActionResult<IEnumerable<TDto>>> GetAll()
        {
            var entities = await _service.GetAllAsync();
            var result = new List<TDto>();
            foreach (var entity in entities)
            {
                result.Add(_mapper.Map(entity, _service));
            }
            return Ok(result);
        }

        /// <summary>Retrieve a single entity by its ID.</summary>
        /// <param name="id">The unique identifier of the entity.</param>
        /// <response code="200">Returns the entity as a DTO.</response>
        /// <response code="404">No entity with the specified ID exists.</response>
        /// <returns>The DTO if found; <c>NotFound</c> otherwise.</returns>
        [HttpGet("{id}")]
        public virtual async Task<ActionResult<TDto>> GetById(int id)
        {
            var entity = await _service.GetByIdAsync(id);
            if (entity == null)
                return NotFound();
            return Ok(_mapper.Map(entity, _service));
        }

        /// <summary>Create a new entity.</summary>
        /// <param name="entity">The entity to create.</param>
        /// <response code="201">Returns the created entity as a DTO with Location header.</response>
        /// <response code="400">The request body is invalid.</response>
        /// <returns>The created DTO with a <c>Location</c> header pointing to <see cref="GetById"/>.</returns>
        [HttpPost]
        public virtual async Task<ActionResult<TDto>> Create([FromBody] TEntity entity)
        {
            await _service.AddAsync(entity);
            return CreatedAtAction(nameof(GetById), new { id = GetEntityId(entity) }, _mapper.Map(entity, _service));
        }

        /// <summary>Update an existing entity.</summary>
        /// <param name="id">The unique identifier of the entity to update.</param>
        /// <param name="entity">The updated entity data.</param>
        /// <response code="204">The entity was updated successfully.</response>
        /// <response code="400">The ID in the URL does not match the entity's ID.</response>
        /// <returns>No content if successful; <c>BadRequest</c> if the IDs do not match.</returns>
        [HttpPut("{id}")]
        public virtual async Task<IActionResult> Update(int id, [FromBody] TEntity entity)
        {
            if (!(GetEntityId(entity) is int entityId) || entityId != id)
                return BadRequest();
            await _service.UpdateAsync(entity);
            return NoContent();
        }

        /// <summary>Delete an entity by its ID.</summary>
        /// <param name="id">The unique identifier of the entity to delete.</param>
        /// <response code="204">The entity was deleted successfully.</response>
        /// <response code="404">No entity with the specified ID exists.</response>
        /// <returns>No content if successful; <c>NotFound</c> otherwise.</returns>
        [HttpDelete("{id}")]
        public virtual async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteByIdAsync(id);
            if (!deleted)
                return NotFound();
            return NoContent();
        }
        
        /// <summary>Extract the entity's ID using reflection.</summary>
        /// <remarks>Override this method for custom ID property resolution.</remarks>
        /// <param name="entity">The entity instance.</param>
        /// <returns>The ID value of the entity.</returns>
        protected virtual object GetEntityId(TEntity entity)
        {
            var prop = typeof(TEntity).GetProperty("Id");
            return prop?.GetValue(entity) ?? 0;
        }
    }
}
