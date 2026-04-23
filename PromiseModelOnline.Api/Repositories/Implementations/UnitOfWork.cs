using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;

namespace PromiseModelOnline.Api.Repositories.Implementations;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IProjectRepository? _projectRepository;
    private IPromiseRepository? _promiseRepository;
    private IEpicRepository? _epicRepository;
    private IJourneyRepository? _journeyRepository;
    private IFlowRepository? _flowRepository;
    private IMomentRepository? _momentRepository;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IProjectRepository Projects => _projectRepository ??= new ProjectRepository(_context);
    public IPromiseRepository Promises => _promiseRepository ??= new PromiseRepository(_context);
    public IEpicRepository Epics => _epicRepository ??= new EpicRepository(_context);
    public IJourneyRepository Journeys => _journeyRepository ??= new JourneyRepository(_context);
    public IFlowRepository Flows => _flowRepository ??= new FlowRepository(_context);
    public IMomentRepository Moments => _momentRepository ??= new MomentRepository(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task<bool> BeginTransactionAsync()
    {
        await _context.Database.BeginTransactionAsync();
        return true;
    }

    public async Task<bool> CommitTransactionAsync()
    {
        await _context.Database.CommitTransactionAsync();
        return true;
    }

    public async Task<bool> RollbackTransactionAsync()
    {
        await _context.Database.RollbackTransactionAsync();
        return true;
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}
