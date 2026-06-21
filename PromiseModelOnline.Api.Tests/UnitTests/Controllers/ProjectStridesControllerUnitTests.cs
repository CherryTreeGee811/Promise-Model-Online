using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

/// <summary>
/// Unit tests for <see cref="ProjectStridesController"/> covering stride operations.
/// Requirements: REQ_USE_012
/// </summary>
public class ProjectStridesControllerUnitTests
{
    private Mock<IStrideService> _mockStrideService = null!;
    private Mock<IMomentService> _mockMomentService = null!;
    private Mock<IGenericMapper<Stride, StrideDto>> _mockMapper = null!;
    private Mock<IPromiseModelOnlineContext> _mockContext = null!;
    private Mock<IProjectService> _mockProjectService = null!;
    private Mock<ILogger<ProjectStridesController>> _mockLogger = null!;
    private ProjectStridesController _controller = null!;

    private const string OwnerSlug = "testowner";
    private const string ProjectSlug = "test-project";

    [SetUp]
    public void SetUp()
    {
        _mockStrideService = new Mock<IStrideService>();
        _mockMomentService = new Mock<IMomentService>();
        _mockMapper = new Mock<IGenericMapper<Stride, StrideDto>>();
        _mockContext = new Mock<IPromiseModelOnlineContext>();
        _mockProjectService = new Mock<IProjectService>();
        _mockLogger = new Mock<ILogger<ProjectStridesController>>();
        _controller = new ProjectStridesController(
            _mockStrideService.Object,
            _mockMomentService.Object,
            _mockMapper.Object,
            _mockContext.Object,
            _mockProjectService.Object,
            _mockLogger.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    private void SetUpProjectResolve(Project? project)
    {
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(OwnerSlug, ProjectSlug))
            .ReturnsAsync(project);
    }

    private Mock<DbSet<T>> CreateMockDbSet<T>(IList<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var mock = new Mock<DbSet<T>>();
        mock.As<IQueryable<T>>().Setup(m => m.Provider)
            .Returns(new TestAsyncQueryProvider<T>(queryable.Provider, queryable));
        mock.As<IQueryable<T>>().Setup(m => m.Expression).Returns(queryable.Expression);
        mock.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        mock.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(() => queryable.GetEnumerator());
        mock.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(() => new TestAsyncEnumerator<T>(data.GetEnumerator()));
        return mock;
    }

    #region GetAll Tests - Happy Path

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Valid owner and project slugs return Ok with stride list")]
    public async Task GetStrides_ReturnsOk()
    {
        // Arrange
        var project = new Project { Id = 1, Slug = ProjectSlug };
        SetUpProjectResolve(project);

        var strides = new List<Stride>
            {
                new Stride { Id = 10, Name = "S1", Iteration = new Iteration { ProjectId = 1 } },
                new Stride { Id = 11, Name = "S2", Iteration = new Iteration { ProjectId = 1 } }
            };
        var mockStridesDbSet = CreateMockDbSet(strides);
        _mockContext.Setup(c => c.Strides).Returns(mockStridesDbSet.Object);

        _mockMapper.Setup(m => m.Map(It.IsAny<Stride>(), _mockStrideService.Object))
            .Returns<Stride, IGenericService<Stride>>((s, svc) =>
                new StrideDto { Id = s.Id, Name = s.Name });

        // Act
        var result = await _controller.GetAll(OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as List<StrideDto>;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!.Count, Is.EqualTo(2));
        Assert.That(data[0].Name, Is.EqualTo("S1"));
        Assert.That(data[1].Name, Is.EqualTo("S2"));
    }

    #endregion

    #region GetAll Tests - Sad Path

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Missing project returns 404 NotFound")]
    public async Task GetStrides_WithMissingProject_ReturnsNotFound()
    {
        // Arrange
        SetUpProjectResolve(null);

        // Act
        var result = await _controller.GetAll(OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    #endregion

    #region UpdateStride (PATCH) Tests - Happy Path

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Valid PATCH request returns NoContent")]
    public async Task PatchStride_ValidRequest_ReturnsOk()
    {
        // Arrange
        var project = new Project { Id = 1, Slug = ProjectSlug };
        SetUpProjectResolve(project);

        var strideId = 10;
        var strides = new List<Stride>
            {
                new Stride { Id = strideId, Name = "S1", Iteration = new Iteration { ProjectId = 1 } }
            };
        var mockStridesDbSet = CreateMockDbSet(strides);
        _mockContext.Setup(c => c.Strides).Returns(mockStridesDbSet.Object);

        _mockMomentService
            .Setup(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId))
            .Returns(Task.CompletedTask);

        var request = new UpdateStrideRequestDto { ProgressUnfinishedMoments = true };

        // Act
        var result = await _controller.UpdateStride(strideId, request, OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
        _mockMomentService.Verify(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId), Times.Once);
    }

    #endregion

    #region UpdateStride (PATCH) Tests - Sad Path

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Service exception logs warning and returns BadRequest")]
    public async Task PatchStride_WhenServiceThrows_ReturnsBadRequest()
    {
        // Arrange
        var project = new Project { Id = 1, Slug = ProjectSlug };
        SetUpProjectResolve(project);

        var strideId = 10;
        var strides = new List<Stride>
            {
                new Stride { Id = strideId, Name = "S1", Iteration = new Iteration { ProjectId = 1 } }
            };
        var mockStridesDbSet = CreateMockDbSet(strides);
        _mockContext.Setup(c => c.Strides).Returns(mockStridesDbSet.Object);

        var ex = new InvalidOperationException("Test error");
        _mockMomentService
            .Setup(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId))
            .ThrowsAsync(ex);

        var request = new UpdateStrideRequestDto { ProgressUnfinishedMoments = true };

        // Act
        var result = await _controller.UpdateStride(strideId, request, OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Is.EqualTo("The stride could not be updated."));
        _mockLogger.VerifyLog(LogLevel.Warning, "Failed to update stride");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Missing project returns 404 NotFound")]
    public async Task PatchStride_WithMissingProject_ReturnsNotFound()
    {
        // Arrange
        SetUpProjectResolve(null);

        // Act
        var result = await _controller.UpdateStride(10, new UpdateStrideRequestDto(), OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
        _mockMomentService.Verify(s => s.MoveUnfinishedMomentsToNextStrideAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region ProgressStride (POST) Tests - Happy Path

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Valid POST progress request returns NoContent")]
    public async Task ProgressStride_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var project = new Project { Id = 1, Slug = ProjectSlug };
        SetUpProjectResolve(project);

        var strideId = 20;
        var strides = new List<Stride>
            {
                new Stride { Id = strideId, Name = "S1", Iteration = new Iteration { ProjectId = 1 } }
            };
        var mockStridesDbSet = CreateMockDbSet(strides);
        _mockContext.Setup(c => c.Strides).Returns(mockStridesDbSet.Object);

        _mockMomentService
            .Setup(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ProgressStride(strideId, OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
        _mockMomentService.Verify(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId), Times.Once);
    }

    #endregion

    #region ProgressStride (POST) Tests - Sad Path

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Service exception logs warning and returns BadRequest")]
    public async Task ProgressStride_WhenServiceThrows_ReturnsBadRequest()
    {
        // Arrange
        var project = new Project { Id = 1, Slug = ProjectSlug };
        SetUpProjectResolve(project);

        var strideId = 20;
        var strides = new List<Stride>
            {
                new Stride { Id = strideId, Name = "S1", Iteration = new Iteration { ProjectId = 1 } }
            };
        var mockStridesDbSet = CreateMockDbSet(strides);
        _mockContext.Setup(c => c.Strides).Returns(mockStridesDbSet.Object);

        var ex = new InvalidOperationException("Test error");
        _mockMomentService
            .Setup(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId))
            .ThrowsAsync(ex);

        // Act
        var result = await _controller.ProgressStride(strideId, OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Is.EqualTo("The stride could not be progressed."));
        _mockLogger.VerifyLog(LogLevel.Warning, "Failed to progress stride");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Missing project returns 404 NotFound")]
    public async Task ProgressStride_WithMissingProject_ReturnsNotFound()
    {
        // Arrange
        SetUpProjectResolve(null);

        // Act
        var result = await _controller.ProgressStride(20, OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
        _mockMomentService.Verify(s => s.MoveUnfinishedMomentsToNextStrideAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region Async query helpers for EF Core mocking

    private class TestAsyncQueryProvider<T> : IAsyncQueryProvider
    {
        private readonly IQueryProvider _inner;
        private readonly IQueryable<T> _source;

        public TestAsyncQueryProvider(IQueryProvider inner, IQueryable<T> source)
        {
            _inner = inner;
            _source = source;
        }

        public IQueryable CreateQuery(Expression expression)
            => new TestAsyncQueryable<T>(this, expression);

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
            => new TestAsyncQueryable<TElement>(this, expression);

        public object? Execute(Expression expression)
            => _source.Provider.Execute(expression);

        public TResult Execute<TResult>(Expression expression)
            => _source.Provider.Execute<TResult>(expression);

        public IAsyncEnumerable<TResult> ExecuteAsync<TResult>(Expression expression)
            => new TestAsyncQueryable<TResult>(this, expression);

        public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken)
        {
            var result = Execute(expression);
            var taskType = typeof(TResult);
            if (taskType.IsGenericType && taskType.GetGenericTypeDefinition() == typeof(Task<>))
            {
                var resultType = taskType.GetGenericArguments()[0];
                var fromResult = typeof(Task).GetMethod(nameof(Task.FromResult))!
                    .MakeGenericMethod(resultType);
                return (TResult)fromResult.Invoke(null, new[] { result })!;
            }
            return (TResult)result!;
        }
    }

    private class TestAsyncQueryable<T> : IQueryable<T>, IAsyncEnumerable<T>
    {
        private readonly Expression _expression;
        private readonly IQueryProvider _provider;

        public TestAsyncQueryable(IQueryProvider provider, Expression expression)
        {
            _provider = provider;
            _expression = expression;
        }

        public Type ElementType => typeof(T);
        public Expression Expression => _expression;
        public IQueryProvider Provider => _provider;
        public IEnumerator<T> GetEnumerator()
            => _provider.Execute<IEnumerable<T>>(_expression).GetEnumerator();
        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
        public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
            => new TestAsyncEnumerator<T>(GetEnumerator());
    }

    private class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
    {
        private readonly IEnumerator<T> _inner;

        public TestAsyncEnumerator(IEnumerator<T> inner) => _inner = inner;

        public ValueTask DisposeAsync()
        {
            _inner.Dispose();
            return ValueTask.CompletedTask;
        }

        public ValueTask<bool> MoveNextAsync()
            => ValueTask.FromResult(_inner.MoveNext());

        public T Current => _inner.Current;
    }

    #endregion
}
