using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

/// <summary>
/// Unit tests for <see cref="SearchCommentsController"/> covering the entity-map endpoint.
/// Requirements: REQ_FUN_017 — Comments and entity map must support linking across the hierarchy.
/// </summary>
public class SearchCommentsControllerUnitTests
{
    private Mock<ICommentRepository> _mockCommentRepository = null!;
    private Mock<ILogger<SearchCommentsController>> _mockLogger = null!;
    private SearchCommentsController _controller = null!;

    /// <summary>Initializes mocks and controller before each test.</summary>
    [SetUp]
    public void SetUp()
    {
        _mockCommentRepository = new Mock<ICommentRepository>();
        _mockLogger = new Mock<ILogger<SearchCommentsController>>();
        _controller = new SearchCommentsController(
            _mockCommentRepository.Object,
            _mockLogger.Object);
    }

    #region GetEntityMap Tests - Happy Path

    [Test]
    [Description("REQ_FUN_017 + REQ-SEC-LOG-001: Valid parent type and ID returns full entity hierarchy map")]
    public async Task GetEntityMap_WithValidParams_ReturnsOk()
    {
        // Arrange
        var projectId = 1;
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("promise", 5))
            .ReturnsAsync(projectId);

        var promises = new List<Promise>
            {
                new Promise { Id = 1, SequenceNumber = 1, StatusColor = "green" },
                new Promise { Id = 2, SequenceNumber = 2, StatusColor = "yellow" }
            };
        _mockCommentRepository.Setup(r => r.GetPromisesByProjectAsync(projectId))
            .ReturnsAsync(promises);

        var promiseIds = promises.Select(p => p.Id).ToList();
        var epics = new List<Epic>
            {
                new Epic { Id = 10, SequenceNumber = 1, StatusColor = "green" }
            };
        _mockCommentRepository.Setup(r => r.GetEpicsByPromiseIdsAsync(promiseIds))
            .ReturnsAsync(epics);

        var epicIds = epics.Select(e => e.Id).ToList();
        var journeys = new List<Journey>
            {
                new Journey { Id = 100, SequenceNumber = 1, StatusColor = "green" }
            };
        _mockCommentRepository.Setup(r => r.GetJourneysByEpicIdsAsync(epicIds))
            .ReturnsAsync(journeys);

        var journeyIds = journeys.Select(j => j.Id).ToList();
        var flows = new List<Flow>
            {
                new Flow { Id = 1000, SequenceNumber = 1, StatusColor = "green" }
            };
        _mockCommentRepository.Setup(r => r.GetFlowsByJourneyIdsAsync(journeyIds))
            .ReturnsAsync(flows);

        var flowIds = flows.Select(f => f.Id).ToList();
        var moments = new List<Moment>
            {
                new Moment { Id = 10000, SequenceNumber = 1, StatusColor = "green" }
            };
        _mockCommentRepository.Setup(r => r.GetMomentsByFlowIdsAsync(flowIds))
            .ReturnsAsync(moments);

        // Act
        var result = await _controller.GetEntityMap("promise", 5);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as List<object>;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!.Count, Is.EqualTo(6));
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync("promise", 5), Times.Once);
        _mockCommentRepository.Verify(r => r.GetPromisesByProjectAsync(projectId), Times.Once);
        _mockCommentRepository.Verify(r => r.GetEpicsByPromiseIdsAsync(promiseIds), Times.Once);
        _mockCommentRepository.Verify(r => r.GetJourneysByEpicIdsAsync(epicIds), Times.Once);
        _mockCommentRepository.Verify(r => r.GetFlowsByJourneyIdsAsync(journeyIds), Times.Once);
        _mockCommentRepository.Verify(r => r.GetMomentsByFlowIdsAsync(flowIds), Times.Once);
    }

    #endregion

    #region GetEntityMap Tests - Sad Path

    [Test]
    [Description("REQ_FUN_017 + REQ-SEC-LOG-001: Invalid parent type for entity map returns bad request and logs warning")]
    public async Task GetEntityMap_WithInvalidParentType_ReturnsBadRequest()
    {
        // Arrange
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("invalid", 1))
            .ThrowsAsync(new System.ArgumentException("Invalid parent type: invalid"));

        // Act
        var result = await _controller.GetEntityMap("invalid", 1);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Is.EqualTo("The entity could not be found for the specified type and ID."));
        _mockLogger.VerifyLog(LogLevel.Warning, "Failed to get entity map");
    }

    [Test]
    [Description("REQ_FUN_017: Zero parent ID returns empty Ok result early — no repository call")]
    public async Task GetEntityMap_WithZeroParentId_ReturnsEmpty()
    {
        // Arrange
        // Act
        var result = await _controller.GetEntityMap("promise", 0);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as System.Array;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!.Length, Is.EqualTo(0));
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    [Description("REQ_FUN_017: Null parent type returns empty Ok result early — no repository call")]
    public async Task GetEntityMap_WithNullParentType_ReturnsEmpty()
    {
        // Arrange
        // Act
        var result = await _controller.GetEntityMap(null, 5);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as System.Array;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!.Length, Is.EqualTo(0));
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    [Description("REQ_FUN_017: Empty string parent type returns empty Ok result early — no repository call")]
    public async Task GetEntityMap_WithEmptyParentType_ReturnsEmpty()
    {
        // Arrange
        // Act
        var result = await _controller.GetEntityMap(string.Empty, 5);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as System.Array;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!.Length, Is.EqualTo(0));
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion
}
