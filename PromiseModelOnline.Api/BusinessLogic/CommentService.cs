using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IUserRepository _userRepository;
        private readonly IGenericMapper<Comment, CommentDTO> _mapper;

        private readonly IGenericRepository<Promise> _promiseRepository;
        private readonly IGenericRepository<Epic> _epicRepository;
        private readonly IGenericRepository<Journey> _journeyRepository;
        private readonly IGenericRepository<Flow> _flowRepository;
        private readonly IGenericRepository<Moment> _momentRepository;

        public CommentService(
            ICommentRepository commentRepository,
            IUserRepository userRepository,
            IGenericMapper<Comment, CommentDTO> mapper,
            IGenericRepository<Promise> promiseRepository,
            IGenericRepository<Epic> epicRepository,
            IGenericRepository<Journey> journeyRepository,
            IGenericRepository<Flow> flowRepository,
            IGenericRepository<Moment> momentRepository)
        {
            _commentRepository = commentRepository;
            _userRepository = userRepository;
            _mapper = mapper;

            _promiseRepository = promiseRepository;
            _epicRepository = epicRepository;
            _journeyRepository = journeyRepository;
            _flowRepository = flowRepository;
            _momentRepository = momentRepository;
        }

        // ✅ Correct repo method used
        public async Task<IEnumerable<CommentDTO>> GetCommentsAsync(string type, int parentId)
        {
            var comments = await _commentRepository.GetCommentsForEntityAsync(type, parentId);
            return comments.Select(c => _mapper.Map(c, null!));
        }

        public async Task<CommentDTO> CreateCommentAsync(CreateCommentDTO dto, int userId)
        {
            if (string.IsNullOrWhiteSpace(dto.Text))
                throw new InvalidOperationException("Comment text cannot be empty");

            var comment = new Comment
            {
                Text = dto.Text,
                UserId = userId,
                ParentCommentId = dto.ParentCommentId,
                CreatedAt = DateTime.UtcNow
            };

            // ✅ Map correct FK field based on type
            switch (dto.ParentType.ToLower())
            {
                case "promise":
                    comment.ProductPromiseId = dto.ParentId;
                    break;

                case "epic":
                    comment.EpicId = dto.ParentId;
                    break;

                case "journey":
                    comment.JourneyId = dto.ParentId;
                    break;

                case "flow":
                    comment.FlowId = dto.ParentId;
                    break;

                case "moment":
                    comment.MomentId = dto.ParentId;
                    break;

                default:
                    throw new InvalidOperationException("Invalid parent type");
            }

            // ✅ Correct repo call
            await _commentRepository.AddCommentAsync(comment);

            return _mapper.Map(comment, null!);
        }

        // ✅ Security helper (now aligned with your schema)
        public async Task<int> GetProjectIdAsync(string type, int parentId)
        {
            switch (type.ToLower())
            {
                case "promise":
                    var promise = await _promiseRepository.GetByIdAsync(parentId)
                        ?? throw new KeyNotFoundException("Promise not found");
                    return promise.ProjectId;

                case "epic":
                    var epic = await _epicRepository.GetByIdAsync(parentId)
                        ?? throw new KeyNotFoundException("Epic not found");

                    var epicPromise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId)
                        ?? throw new KeyNotFoundException("Promise not found");

                    return epicPromise.ProjectId;

                case "journey":
                    var journey = await _journeyRepository.GetByIdAsync(parentId)
                        ?? throw new KeyNotFoundException("Journey not found");

                    return await GetProjectIdAsync("epic", journey.EpicId);

                case "flow":
                    var flow = await _flowRepository.GetByIdAsync(parentId)
                        ?? throw new KeyNotFoundException("Flow not found");

                    return await GetProjectIdAsync("journey", flow.JourneyId);

                case "moment":
                    var moment = await _momentRepository.GetByIdAsync(parentId)
                        ?? throw new KeyNotFoundException("Moment not found");

                    return await GetProjectIdAsync("flow", moment.FlowId);

                default:
                    throw new InvalidOperationException("Unsupported type");
            }
        }
    }
}