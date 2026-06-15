using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Business logic for <see cref="Iteration"/> entities scoped to a parent project.</summary>
    /// <remarks>
    ///   Delegates iteration queries to <see cref="IIterationRepository"/>. Scoped lifetime.
    /// </remarks>
    public class IterationService : GenericService<Iteration>, IIterationService
    {
        private readonly IIterationRepository _iterationRepository;

        /// <summary>Initializes the service with the iteration repository.</summary>
        /// <param name="iterationRepository">Repository for iteration data access.</param>
        public IterationService(IIterationRepository iterationRepository) : base(iterationRepository)
        {
            _iterationRepository = iterationRepository;
        }

        /// <summary>Return all iterations (time-boxed planning cycles) for a project.</summary>
        /// <param name="projectId">The project ID.</param>
        /// <returns>All iterations belonging to the project.</returns>
        public async Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId)
            => await _iterationRepository.GetIterationsByProjectAsync(projectId);
    }
}