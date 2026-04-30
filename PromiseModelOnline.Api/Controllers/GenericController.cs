using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>
    /// Generic RESTful controller for basic CRUD operations.
    /// </summary>
    /// <typeparam name="TEntity">The entity type.</typeparam>
    /// <typeparam name="TDto">The DTO type for transport.</typeparam>
    [ApiController]
    [Route("api/[controller]")]
    public class GenericController<TEntity, TDto> : ControllerBase
        where TEntity : class
        where TDto : class
    {
        /// <summary>
        /// The generic service for business logic and data access.
        /// </summary>
        protected readonly IGenericService<TEntity> _service;

        /// <summary>
        /// The generic mapper for mapping entities to DTOs.
        /// </summary>
        protected readonly IGenericMapper<TEntity, TDto> _mapper;

        /// <summary>
        /// Initializes a new instance of the <see cref="GenericController{TEntity, TDto}"/> class.
        /// </summary>
        /// <param name="service">The generic service instance.</param>
        /// <param name="mapper">The generic mapper instance.</param>
        public GenericController(IGenericService<TEntity> service, IGenericMapper<TEntity, TDto> mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        /// <summary>
        /// Gets all entities.
        /// </summary>
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

        /// <summary>
        /// Gets an entity by id.
        /// </summary>
        /// <param name="id">The unique identifier of the entity.</param>
        /// <returns>The DTO if found; otherwise, NotFound.</returns>
        [HttpGet("{id}")]
        public virtual async Task<ActionResult<TDto>> GetById(int id)
        {
            var entity = await _service.GetByIdAsync(id);
            if (entity == null)
                return NotFound();
            return Ok(_mapper.Map(entity, _service));
        }

        /// <summary>
        /// Creates a new entity.
        /// </summary>
        /// <param name="entity">The entity to create.</param>
        /// <returns>The created DTO.</returns>
        [HttpPost]
        public virtual async Task<ActionResult<TDto>> Create([FromBody] TEntity entity)
        {
            await _service.AddAsync(entity);
            return CreatedAtAction(nameof(GetById), new { id = GetEntityId(entity) }, _mapper.Map(entity, _service));
        }

        /// <summary>
        /// Updates an existing entity.
        /// </summary>
        /// <param name="id">The unique identifier of the entity to update.</param>
        /// <param name="entity">The updated entity data.</param>
        /// <returns>No content if successful; otherwise, BadRequest if the id does not match.</returns>
        [HttpPut("{id}")]
        public virtual async Task<IActionResult> Update(int id, [FromBody] TEntity entity)
        {
            if (!(GetEntityId(entity) is int entityId) || entityId != id)
                return BadRequest();
            await _service.UpdateAsync(entity);
            return NoContent();
        }

        /// <summary>
        /// Deletes an entity by id.
        /// </summary>
        /// <param name="id">The unique identifier of the entity to delete.</param>
        /// <returns>No content if successful; otherwise, NotFound if the entity does not exist.</returns>
        [HttpDelete("{id}")]
        public virtual async Task<IActionResult> Delete(int id)
        {
            var entity = await _service.GetByIdAsync(id);
            if (entity == null)
                return NotFound();
            await _service.RemoveAsync(entity);
            return NoContent();
        }

        /// <summary>
        /// Gets the entity's id value using reflection. Override for custom logic.
        /// </summary>
        /// <param name="entity">The entity instance.</param>
        /// <returns>The id value of the entity.</returns>
        protected virtual object GetEntityId(TEntity entity)
        {
            var prop = typeof(TEntity).GetProperty("Id");
            return prop?.GetValue(entity) ?? 0;
        }
    }
}
