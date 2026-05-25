using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

public class ProjectExportServiceUnitTests
{
    private Mock<IProjectRepository> _projectRepoMock = null!;
    private Mock<IEpicRepository> _epicRepoMock = null!;
    private Mock<IJourneyRepository> _journeyRepoMock = null!;
    private Mock<IFlowRepository> _flowRepoMock = null!;
    private Mock<IMomentRepository> _momentRepoMock = null!;
    private Mock<IMomentTaskRepository> _taskRepoMock = null!;
    private Mock<IIterationRepository> _iterationRepoMock = null!;
    private Mock<IStrideRepository> _strideRepoMock = null!;
    private ProjectExportService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _projectRepoMock = new Mock<IProjectRepository>();
        _epicRepoMock = new Mock<IEpicRepository>();
        _journeyRepoMock = new Mock<IJourneyRepository>();
        _flowRepoMock = new Mock<IFlowRepository>();
        _momentRepoMock = new Mock<IMomentRepository>();
        _taskRepoMock = new Mock<IMomentTaskRepository>();
        _iterationRepoMock = new Mock<IIterationRepository>();
        _strideRepoMock = new Mock<IStrideRepository>();

        _service = new ProjectExportService(
            _projectRepoMock.Object,
            _epicRepoMock.Object,
            _journeyRepoMock.Object,
            _flowRepoMock.Object,
            _momentRepoMock.Object,
            _taskRepoMock.Object,
            _iterationRepoMock.Object,
            _strideRepoMock.Object);
    }

    [Test]
    public async Task BuildExportAsync_BuildsFullHierarchyAndStrideLinks()
    {
        var project = new Project { Id = 5, Name = "Project", OwnerId = 10 };
        _projectRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(project);

        var promise = new Promise { Id = 11, ProjectId = 5, Statement = "Promise", DisplayOrder = 2, StatusColor = "green" };
        var epic = new Epic { Id = 21, ProductPromiseId = 11, Statement = "Epic", DisplayOrder = 3, StatusColor = "yellow" };
        var journey = new Journey { Id = 31, EpicId = 21, Statement = "Journey", DisplayOrder = 4, StatusColor = "orange" };
        var flow = new Flow { Id = 41, JourneyId = 31, Statement = "Flow", DisplayOrder = 5, StatusColor = "black" };
        var moment = new Moment
        {
            Id = 51,
            FlowId = 41,
            Statement = "Moment",
            Type = MomentType.Job,
            Status = MomentStatus.Blocked,
            EffortEstimate = Estimate.M,
            AssignedStrideId = 71,
            OriginalStrideId = 72,
            DisplayOrder = 6,
            StatusColor = "red"
        };
        var task = new MomentTask { Id = 61, MomentId = 51, Name = "Task", Description = "Task description", IsCompleted = true };
        var iteration = new Iteration { Id = 61, ProjectId = 5, Name = "Iteration" };
        var stride = new Stride { Id = 71, IterationId = 61, Name = "Stride", StartDate = new DateTime(2026, 5, 1), EndDate = new DateTime(2026, 5, 14), DurationDays = 14, IsActive = true };

        _projectRepoMock.Setup(r => r.GetProductPromisesByProjectAsync(5)).ReturnsAsync(new[] { promise });
        _epicRepoMock.Setup(r => r.GetEpicsByPromiseAsync(11)).ReturnsAsync(new[] { epic });
        _journeyRepoMock.Setup(r => r.GetJourneysByEpicAsync(21)).ReturnsAsync(new[] { journey });
        _flowRepoMock.Setup(r => r.GetFlowsByJourneyAsync(31)).ReturnsAsync(new[] { flow });
        _momentRepoMock.Setup(r => r.GetMomentsByFlowAsync(41)).ReturnsAsync(new[] { moment });
        _taskRepoMock.Setup(r => r.GetTasksByMomentAsync(51)).ReturnsAsync(new[] { task });
        _iterationRepoMock.Setup(r => r.GetIterationsByProjectAsync(5)).ReturnsAsync(new[] { iteration });
        _strideRepoMock.Setup(r => r.GetStridesByIterationAsync(61)).ReturnsAsync(new[] { stride });
        _momentRepoMock.Setup(r => r.GetMomentsByStrideAsync(71)).ReturnsAsync(new[] { moment });

        var export = await _service.BuildExportAsync(5);

        Assert.That(export.SchemaVersion, Is.EqualTo("1.0"));
        Assert.That(export.Project.Id, Is.EqualTo(5));
        Assert.That(export.Project.ProductPromises.Single().Epics.Single().Journeys.Single().Flows.Single().Moments.Single().Tasks.Single().Id, Is.EqualTo(61));
        Assert.That(export.Project.Iterations.Single().Strides.Single().MomentIds, Does.Contain(51));
        Assert.That(export.Project.ProductPromises.Single().Epics.Single().Journeys.Single().Flows.Single().Moments.Single().AssignedStrideId, Is.EqualTo(71));
        Assert.That(export.Project.ProductPromises.Single().Epics.Single().Journeys.Single().Flows.Single().Moments.Single().Status, Is.EqualTo(MomentStatus.Blocked));
    }

    [Test]
    public void BuildExportAsync_WhenProjectMissing_Throws()
    {
        _projectRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Project?)null);

        Assert.ThrowsAsync<KeyNotFoundException>(() => _service.BuildExportAsync(999));
    }
}