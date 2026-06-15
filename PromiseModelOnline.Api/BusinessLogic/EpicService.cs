using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Business logic for <see cref="Epic"/> entities with hierarchy status propagation.</summary>
    /// <remarks>
    ///   Overrides <see cref="GenericService{T}.AddAsync"/> and <see cref="GenericService{T}.DeleteByIdAsync"/>
    ///   to trigger hierarchy status recalculation. Scoped lifetime.
    /// </remarks>
    public class EpicService : GenericService<Epic>, IEpicService
    {
        private readonly IEpicRepository _epicRepository;
        private readonly IHierarchyStatusService _hierarchyStatusService;

        /// <summary>Initializes the service with repository and hierarchy status service.</summary>
        /// <param name="epicRepository">Repository for epic data access.</param>
        /// <param name="hierarchyStatusService">Service for hierarchy status recalculation.</param>
        public EpicService(IEpicRepository epicRepository, IHierarchyStatusService hierarchyStatusService)
            : base(epicRepository)
        {
            _epicRepository = epicRepository;
            _hierarchyStatusService = hierarchyStatusService;
        }

        /// <summary>Return all epics belonging to a product promise.</summary>
        /// <param name="promiseId">The parent product promise ID.</param>
        /// <returns>All epics under the given promise.</returns>
        public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId)
            => await _epicRepository.GetEpicsByPromiseAsync(promiseId);

        /// <summary>Add an epic and trigger hierarchy status recalculation on its parent promise.</summary>
        /// <param name="entity">The epic to add.</param>
        public override async Task AddAsync(Epic entity)
        {
            await base.AddAsync(entity);
            await _hierarchyStatusService.RecalculateFromEpicAsync(entity.Id);
        }

        /// <summary>Delete an epic by ID and trigger hierarchy status recalculation on its parent promise.</summary>
        /// <param name="id">The epic's primary key.</param>
        /// <returns><c>true</c> if the epic was found and deleted; <c>false</c> otherwise.</returns>
        public override async Task<bool> DeleteByIdAsync(object id)
        {
            var epic = await _epicRepository.GetByIdAsync(id);
            if (epic is null)
            {
                return false;
            }

            var deleted = await base.DeleteByIdAsync(id);
            if (deleted)
            {
                await _hierarchyStatusService.RecalculateFromPromiseAsync(epic.ProductPromiseId);
            }

            return deleted;
        }
    }
}