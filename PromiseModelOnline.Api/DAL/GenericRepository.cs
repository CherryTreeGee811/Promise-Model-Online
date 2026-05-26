using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PMO.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected readonly PromiseModelOnlineContext _context;
        protected readonly DbSet<T> _dbSet;

        public GenericRepository(PromiseModelOnlineContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task<IEnumerable<T>> GetAllAsync()
            => await _dbSet.ToListAsync();

        public async Task<T?> GetByIdAsync(object id)
            => await _dbSet.FindAsync(id);

        protected async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
            => await _dbSet.Where(predicate).ToListAsync();

        public async Task AddAsync(T entity)
            => await _dbSet.AddAsync(entity);

        public void Update(T entity)
            => _dbSet.Update(entity);

        public async Task<bool> DeleteByIdAsync(object id)
        {
            var entity = await _dbSet.FindAsync(id);
            if (entity == null) return false;

            await RemoveWithDependentsAsync(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task RemoveWithDependentsAsync(object entity)
        {
            switch (entity)
            {
                case Project project:
                    await RemoveProjectAsync(project);
                    return;
                case Promise promise:
                    await RemovePromiseAsync(promise);
                    return;
                case Epic epic:
                    await RemoveEpicAsync(epic);
                    return;
                case Journey journey:
                    await RemoveJourneyAsync(journey);
                    return;
                case Flow flow:
                    await RemoveFlowAsync(flow);
                    return;
                case Moment moment:
                    await RemoveMomentAsync(moment);
                    return;
                case Comment comment:
                    await RemoveCommentAsync(comment);
                    return;
                default:
                    _context.Remove(entity);
                    return;
            }
        }

        private async Task RemoveProjectAsync(Project project)
        {
            var promises = await _context.Set<Promise>()
                .Where(promise => promise.ProjectId == project.Id)
                .ToListAsync();

            foreach (var promise in promises)
            {
                await RemovePromiseAsync(promise);
            }

            var iterations = await _context.Set<Iteration>()
                .Where(iteration => iteration.ProjectId == project.Id)
                .ToListAsync();

            foreach (var iteration in iterations)
            {
                await RemoveIterationAsync(iteration);
            }

            var permissions = await _context.Set<Permission>()
                .Where(permission => permission.ProjectId == project.Id)
                .ToListAsync();

            _context.RemoveRange(permissions);
            _context.Remove(project);
        }

        private async Task RemoveIterationAsync(Iteration iteration)
        {
            var strides = await _context.Set<Stride>()
                .Where(stride => stride.IterationId == iteration.Id)
                .ToListAsync();

            foreach (var stride in strides)
            {
                await RemoveStrideAsync(stride);
            }

            _context.Remove(iteration);
        }

        private async Task RemoveStrideAsync(Stride stride)
        {
            var moments = await _context.Set<Moment>()
                .Where(moment => moment.AssignedStrideId == stride.Id || moment.OriginalStrideId == stride.Id)
                .ToListAsync();

            foreach (var moment in moments)
            {
                if (moment.AssignedStrideId == stride.Id)
                {
                    moment.AssignedStrideId = null;
                }

                if (moment.OriginalStrideId == stride.Id)
                {
                    moment.OriginalStrideId = null;
                }
            }

            _context.Remove(stride);
        }

        private async Task RemovePromiseAsync(Promise promise)
        {
            var epics = await _context.Set<Epic>()
                .Where(epic => epic.ProductPromiseId == promise.Id)
                .ToListAsync();

            foreach (var epic in epics)
            {
                await RemoveEpicAsync(epic);
            }

            await RemoveCommentsForEntityAsync("promise", promise.Id);
            _context.Remove(promise);
        }

        private async Task RemoveEpicAsync(Epic epic)
        {
            var journeys = await _context.Set<Journey>()
                .Where(journey => journey.EpicId == epic.Id)
                .ToListAsync();

            foreach (var journey in journeys)
            {
                await RemoveJourneyAsync(journey);
            }

            await RemoveCommentsForEntityAsync("epic", epic.Id);
            _context.Remove(epic);
        }

        private async Task RemoveJourneyAsync(Journey journey)
        {
            var flows = await _context.Set<Flow>()
                .Where(flow => flow.JourneyId == journey.Id)
                .ToListAsync();

            foreach (var flow in flows)
            {
                await RemoveFlowAsync(flow);
            }

            await RemoveCommentsForEntityAsync("journey", journey.Id);
            _context.Remove(journey);
        }

        private async Task RemoveFlowAsync(Flow flow)
        {
            var moments = await _context.Set<Moment>()
                .Where(moment => moment.FlowId == flow.Id)
                .ToListAsync();

            foreach (var moment in moments)
            {
                await RemoveMomentAsync(moment);
            }

            await RemoveCommentsForEntityAsync("flow", flow.Id);
            _context.Remove(flow);
        }

        private async Task RemoveMomentAsync(Moment moment)
        {
            var assignments = await _context.Set<MomentAssignment>()
                .Where(assignment => assignment.MomentId == moment.Id)
                .ToListAsync();

            var tasks = await _context.Set<MomentTask>()
                .Where(task => task.MomentId == moment.Id)
                .ToListAsync();

            var bugReworkTasks = await _context.Set<BugReworkTask>()
                .Where(task => task.MomentId == moment.Id)
                .ToListAsync();

            _context.RemoveRange(assignments);
            _context.RemoveRange(tasks);
            _context.RemoveRange(bugReworkTasks);

            await RemoveCommentsForEntityAsync("moment", moment.Id);
            _context.Remove(moment);
        }

        private async Task RemoveCommentAsync(Comment comment)
        {
            var replies = await _context.Set<Comment>()
                .Where(reply => reply.ParentCommentId == comment.Id)
                .ToListAsync();

            foreach (var reply in replies)
            {
                await RemoveCommentAsync(reply);
            }

            var mentions = await _context.Set<CommentMention>()
                .Where(mention => mention.CommentId == comment.Id)
                .ToListAsync();

            _context.RemoveRange(mentions);
            _context.Remove(comment);
        }

        private async Task RemoveCommentsForEntityAsync(string parentType, int parentId)
        {
            var comments = await _context.Set<Comment>()
                .Where(comment => comment.ParentCommentId == null)
                .Where(comment =>
                    parentType == "promise" ? comment.ProductPromiseId == parentId :
                    parentType == "epic" ? comment.EpicId == parentId :
                    parentType == "journey" ? comment.JourneyId == parentId :
                    parentType == "flow" ? comment.FlowId == parentId :
                    parentType == "moment" ? comment.MomentId == parentId :
                    false)
                .ToListAsync();

            foreach (var comment in comments)
            {
                await RemoveCommentAsync(comment);
            }
        }

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}