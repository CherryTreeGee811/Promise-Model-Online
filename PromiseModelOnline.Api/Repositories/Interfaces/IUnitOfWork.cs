namespace PromiseModelOnline.Api.Repositories.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IProjectRepository Projects { get; }
    IPromiseRepository Promises { get; }
    IEpicRepository Epics { get; }
    IJourneyRepository Journeys { get; }
    IFlowRepository Flows { get; }
    IMomentRepository Moments { get; }

    Task<int> SaveChangesAsync();
    Task<bool> BeginTransactionAsync();
    Task<bool> CommitTransactionAsync();
    Task<bool> RollbackTransactionAsync();
}
