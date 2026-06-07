using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class CommentRepository : ICommentRepository
    {
        private readonly PromiseModelOnlineContext _context;

        public CommentRepository(PromiseModelOnlineContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Comment>> GetCommentsForEntityAsync(string parentType, int parentId)
        {
            IQueryable<Comment> query = _context.Set<Comment>()
                .Include(c => c.User)
                .Include(c => c.Mentions)
                    .ThenInclude(m => m.MentionedUser)
                .Include(c => c.Replies)       // for threading
                    .ThenInclude(r => r.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.Mentions)
                        .ThenInclude(m => m.MentionedUser)
                .Where(c => c.ParentCommentId == null); // top-level comments only

            query = parentType.ToLower() switch
            {
                "promise" => query.Where(c => c.ProductPromiseId == parentId),
                "epic" => query.Where(c => c.EpicId == parentId),
                "journey" => query.Where(c => c.JourneyId == parentId),
                "flow" => query.Where(c => c.FlowId == parentId),
                "moment" => query.Where(c => c.MomentId == parentId),
                _ => throw new ArgumentException("Invalid parent type")
            };

            return await query.OrderBy(c => c.CreatedAt).ToListAsync();
        }

        public async Task AddCommentAsync(Comment comment)
        {
            await _context.Set<Comment>().AddAsync(comment);
            await _context.SaveChangesAsync();
        }

        public async Task AddMentionAsync(CommentMention mention)
        {
            await _context.Set<CommentMention>().AddAsync(mention);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<StackSearchResult>> SearchStackByStatementAsync(int projectId, string searchTerm, int maxResults = 5)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return Enumerable.Empty<StackSearchResult>();

            var results = new List<StackSearchResult>();
            var lowerSearch = searchTerm.ToLower();
            var (parsedType, parsedSeq) = ParseEntityReference(searchTerm);

            var promises = await _context.Set<Promise>()
                .Where(p => p.ProjectId == projectId && (
                    p.Statement.ToLower().Contains(lowerSearch) ||
                    (parsedType == "promise" && p.SequenceNumber == parsedSeq)))
                .Take(maxResults)
                .ToListAsync();
            results.AddRange(promises.Select(p => new StackSearchResult("promise", p.Id, p.SequenceNumber, p.Statement, p.StatusColor)));

            var promiseIds = await _context.Set<Promise>()
                .Where(p => p.ProjectId == projectId)
                .Select(p => p.Id)
                .ToListAsync();

            var epics = await _context.Set<Epic>()
                .Where(e => promiseIds.Contains(e.ProductPromiseId) && (
                    e.Statement.ToLower().Contains(lowerSearch) ||
                    (parsedType == "epic" && e.SequenceNumber == parsedSeq)))
                .Take(maxResults)
                .ToListAsync();
            results.AddRange(epics.Select(e => new StackSearchResult("epic", e.Id, e.SequenceNumber, e.Statement, e.StatusColor)));

            var epicIds = epics.Select(e => e.Id)
                .Concat(await _context.Set<Epic>()
                    .Where(e => promiseIds.Contains(e.ProductPromiseId))
                    .Select(e => e.Id)
                    .ToListAsync())
                .Distinct()
                .ToList();

            var journeys = await _context.Set<Journey>()
                .Where(j => epicIds.Contains(j.EpicId) && (
                    j.Statement.ToLower().Contains(lowerSearch) ||
                    (parsedType == "journey" && j.SequenceNumber == parsedSeq)))
                .Take(maxResults)
                .ToListAsync();
            results.AddRange(journeys.Select(j => new StackSearchResult("journey", j.Id, j.SequenceNumber, j.Statement, j.StatusColor)));

            var journeyIds = journeys.Select(j => j.Id)
                .Concat(await _context.Set<Journey>()
                    .Where(j => epicIds.Contains(j.EpicId))
                    .Select(j => j.Id)
                    .ToListAsync())
                .Distinct()
                .ToList();

            var flows = await _context.Set<Flow>()
                .Where(f => journeyIds.Contains(f.JourneyId) && (
                    f.Statement.ToLower().Contains(lowerSearch) ||
                    (parsedType == "flow" && f.SequenceNumber == parsedSeq)))
                .Take(maxResults)
                .ToListAsync();
            results.AddRange(flows.Select(f => new StackSearchResult("flow", f.Id, f.SequenceNumber, f.Statement, f.StatusColor)));

            var flowIds = flows.Select(f => f.Id)
                .Concat(await _context.Set<Flow>()
                    .Where(f => journeyIds.Contains(f.JourneyId))
                    .Select(f => f.Id)
                    .ToListAsync())
                .Distinct()
                .ToList();

            var moments = await _context.Set<Moment>()
                .Where(m => flowIds.Contains(m.FlowId) && (
                    m.Statement.ToLower().Contains(lowerSearch) ||
                    (parsedType == "moment" && m.SequenceNumber == parsedSeq)))
                .Take(maxResults)
                .ToListAsync();
            results.AddRange(moments.Select(m => new StackSearchResult("moment", m.Id, m.SequenceNumber, m.Statement, m.StatusColor)));

            return results.OrderBy(r => r.Statement).Take(maxResults).ToList();
        }

        private static (string? type, int? seq) ParseEntityReference(string searchTerm)
        {
            var match = System.Text.RegularExpressions.Regex.Match(
                searchTerm.Trim(),
                @"^(promise|epic|journey|flow|moment)[-\s]?(\d+)$",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            if (match.Success)
                return (match.Groups[1].Value.ToLowerInvariant(), int.Parse(match.Groups[2].Value));

            return (null, null);
        }

        public async Task<IEnumerable<Promise>> GetPromisesByProjectAsync(int projectId)
        {
            return await _context.Set<Promise>()
                .Where(p => p.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Epic>> GetEpicsByPromiseIdsAsync(List<int> promiseIds)
        {
            return await _context.Set<Epic>()
                .Where(e => promiseIds.Contains(e.ProductPromiseId))
                .ToListAsync();
        }

        public async Task<IEnumerable<Journey>> GetJourneysByEpicIdsAsync(List<int> epicIds)
        {
            return await _context.Set<Journey>()
                .Where(j => epicIds.Contains(j.EpicId))
                .ToListAsync();
        }

        public async Task<IEnumerable<Flow>> GetFlowsByJourneyIdsAsync(List<int> journeyIds)
        {
            return await _context.Set<Flow>()
                .Where(f => journeyIds.Contains(f.JourneyId))
                .ToListAsync();
        }

        public async Task<IEnumerable<Moment>> GetMomentsByFlowIdsAsync(List<int> flowIds)
        {
            return await _context.Set<Moment>()
                .Where(m => flowIds.Contains(m.FlowId))
                .ToListAsync();
        }

        public async Task<int> ResolveProjectIdAsync(string parentType, int parentId)
        {
            var normalizedType = parentType.ToLower();

            if (normalizedType == "promise")
            {
                var promise = await _context.Set<Promise>().FindAsync(parentId);
                return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
            }

            if (normalizedType == "epic")
            {
                var epic = await _context.Set<Epic>().FindAsync(parentId);
                if (epic == null) throw new ArgumentException("Epic not found");
                var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
                return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
            }

            if (normalizedType == "journey")
            {
                var journey = await _context.Set<Journey>().FindAsync(parentId);
                if (journey == null) throw new ArgumentException("Journey not found");
                var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
                if (epic == null) throw new ArgumentException("Epic not found");
                var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
                return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
            }

            if (normalizedType == "flow")
            {
                var flow = await _context.Set<Flow>().FindAsync(parentId);
                if (flow == null) throw new ArgumentException("Flow not found");
                var journey = await _context.Set<Journey>().FindAsync(flow.JourneyId);
                if (journey == null) throw new ArgumentException("Journey not found");
                var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
                if (epic == null) throw new ArgumentException("Epic not found");
                var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
                return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
            }

            if (normalizedType == "moment")
            {
                var moment = await _context.Set<Moment>().FindAsync(parentId);
                if (moment == null) throw new ArgumentException("Moment not found");
                var flow = await _context.Set<Flow>().FindAsync(moment.FlowId);
                if (flow == null) throw new ArgumentException("Flow not found");
                var journey = await _context.Set<Journey>().FindAsync(flow.JourneyId);
                if (journey == null) throw new ArgumentException("Journey not found");
                var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
                if (epic == null) throw new ArgumentException("Epic not found");
                var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
                return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
            }

            throw new ArgumentException($"Invalid parent type: {parentType}");
        }
    }
}