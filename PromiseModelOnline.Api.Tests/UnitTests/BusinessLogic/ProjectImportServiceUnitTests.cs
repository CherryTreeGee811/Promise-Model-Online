using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

public class ProjectImportServiceUnitTests
{
    private Mock<IPromiseModelOnlineContext> _contextMock = null!;
    private Mock<IProjectRepository> _projectRepoMock = null!;
    private Mock<IGenericRepository<Promise>> _promiseRepoMock = null!;
    private Mock<IEpicRepository> _epicRepoMock = null!;
    private Mock<IJourneyRepository> _journeyRepoMock = null!;
    private Mock<IFlowRepository> _flowRepoMock = null!;
    private Mock<IMomentRepository> _momentRepoMock = null!;
    private Mock<IMomentTaskRepository> _taskRepoMock = null!;
    private Mock<IIterationRepository> _iterationRepoMock = null!;
    private Mock<IStrideRepository> _strideRepoMock = null!;
    private Mock<IUserRepository> _userRepoMock = null!;
    private ProjectImportService _service = null!;

    private Project? _addedProject;
    private Promise? _addedPromise;
    private Epic? _addedEpic;
    private Journey? _addedJourney;
    private Flow? _addedFlow;
    private Moment? _addedMoment;
    private MomentTask? _addedTask;
    private Iteration? _addedIteration;
    private Stride? _addedStride;

    [SetUp]
    public void SetUp()
    {
        _contextMock = new Mock<IPromiseModelOnlineContext>();
        _projectRepoMock = new Mock<IProjectRepository>();
        _promiseRepoMock = new Mock<IGenericRepository<Promise>>();
        _epicRepoMock = new Mock<IEpicRepository>();
        _journeyRepoMock = new Mock<IJourneyRepository>();
        _flowRepoMock = new Mock<IFlowRepository>();
        _momentRepoMock = new Mock<IMomentRepository>();
        _taskRepoMock = new Mock<IMomentTaskRepository>();
        _iterationRepoMock = new Mock<IIterationRepository>();
        _strideRepoMock = new Mock<IStrideRepository>();
        _userRepoMock = new Mock<IUserRepository>();

        _projectRepoMock.Setup(r => r.AddAsync(It.IsAny<Project>()))
            .Callback<Project>(project =>
            {
                _addedProject = project;
                project.Id = 100;
            })
            .Returns(Task.CompletedTask);
        _projectRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _promiseRepoMock.Setup(r => r.AddAsync(It.IsAny<Promise>()))
            .Callback<Promise>(promise =>
            {
                _addedPromise = promise;
                promise.Id = 110;
            })
            .Returns(Task.CompletedTask);
        _promiseRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _epicRepoMock.Setup(r => r.AddAsync(It.IsAny<Epic>()))
            .Callback<Epic>(epic =>
            {
                _addedEpic = epic;
                epic.Id = 120;
            })
            .Returns(Task.CompletedTask);
        _epicRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _journeyRepoMock.Setup(r => r.AddAsync(It.IsAny<Journey>()))
            .Callback<Journey>(journey =>
            {
                _addedJourney = journey;
                journey.Id = 130;
            })
            .Returns(Task.CompletedTask);
        _journeyRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _flowRepoMock.Setup(r => r.AddAsync(It.IsAny<Flow>()))
            .Callback<Flow>(flow =>
            {
                _addedFlow = flow;
                flow.Id = 140;
            })
            .Returns(Task.CompletedTask);
        _flowRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _momentRepoMock.Setup(r => r.AddAsync(It.IsAny<Moment>()))
            .Callback<Moment>(moment =>
            {
                _addedMoment = moment;
                moment.Id = 150;
            })
            .Returns(Task.CompletedTask);
        _momentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _taskRepoMock.Setup(r => r.AddAsync(It.IsAny<MomentTask>()))
            .Callback<MomentTask>(task =>
            {
                _addedTask = task;
                task.Id = 160;
            })
            .Returns(Task.CompletedTask);
        _taskRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _iterationRepoMock.Setup(r => r.AddAsync(It.IsAny<Iteration>()))
            .Callback<Iteration>(iteration =>
            {
                _addedIteration = iteration;
                iteration.Id = 170;
            })
            .Returns(Task.CompletedTask);
        _iterationRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _strideRepoMock.Setup(r => r.AddAsync(It.IsAny<Stride>()))
            .Callback<Stride>(stride =>
            {
                _addedStride = stride;
                stride.Id = 180;
            })
            .Returns(Task.CompletedTask);
        _strideRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _userRepoMock.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(new User { Id = 7, Email = "known@example.com" });

        _service = new ProjectImportService(
            _contextMock.Object,
            _projectRepoMock.Object,
            _promiseRepoMock.Object,
            _epicRepoMock.Object,
            _journeyRepoMock.Object,
            _flowRepoMock.Object,
            _momentRepoMock.Object,
            _taskRepoMock.Object,
            _iterationRepoMock.Object,
            _strideRepoMock.Object,
            _userRepoMock.Object);
    }

    [Test]
    public async Task ImportAsync_RebuildsHierarchyAndRemapsReferences()
    {
        var document = new ProjectExportDocument
        {
            SchemaVersion = "1.0",
            Project = new ProjectExportProject
            {
                Id = 1,
                Name = "Imported project",
                OwnerId = 999,
                ProductPromises =
                [
                    new ProjectExportPromise
                    {
                        Id = 10,
                        ProjectId = 1,
                        Statement = "Promise",
                        OwnerId = 7,
                        DisplayOrder = 1,
                        StatusColor = "green",
                        Epics =
                        [
                            new ProjectExportEpic
                            {
                                Id = 20,
                                ProductPromiseId = 10,
                                Statement = "Epic",
                                DisplayOrder = 2,
                                StatusColor = "yellow",
                                Journeys =
                                [
                                    new ProjectExportJourney
                                    {
                                        Id = 30,
                                        EpicId = 20,
                                        Statement = "Journey",
                                        DisplayOrder = 3,
                                        StatusColor = "orange",
                                        Flows =
                                        [
                                            new ProjectExportFlow
                                            {
                                                Id = 40,
                                                JourneyId = 30,
                                                Statement = "Flow",
                                                DisplayOrder = 4,
                                                StatusColor = "black",
                                                Moments =
                                                [
                                                    new ProjectExportMoment
                                                    {
                                                        Id = 50,
                                                        FlowId = 40,
                                                        Statement = "Moment",
                                                        Type = MomentType.Job,
                                                        Status = MomentStatus.Blocked,
                                                        OwnerId = 7,
                                                        AssignedStrideId = 80,
                                                        OriginalStrideId = 80,
                                                        DisplayOrder = 5,
                                                        StatusColor = "red",
                                                        Tasks =
                                                        [
                                                            new ProjectExportMomentTask
                                                            {
                                                                Id = 60,
                                                                MomentId = 50,
                                                                Name = "Task",
                                                                Description = "Task",
                                                                OwnerId = 999,
                                                                IsCompleted = true
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                Iterations =
                [
                    new ProjectExportIteration
                    {
                        Id = 70,
                        ProjectId = 1,
                        Name = "Iteration",
                        CreatedAt = new DateTime(2026, 5, 1),
                        Strides =
                        [
                            new ProjectExportStride
                            {
                                Id = 80,
                                IterationId = 70,
                                Name = "Stride",
                                StartDate = new DateTime(2026, 5, 1),
                                EndDate = new DateTime(2026, 5, 14),
                                DurationDays = 14,
                                IsActive = true,
                                CreatedAt = new DateTime(2026, 5, 1),
                                MomentIds = [50]
                            }
                        ]
                    }
                ]
            }
        };

        var result = await _service.ImportAsync(document, 42);

        Assert.That(result.ProjectId, Is.EqualTo(100));
        Assert.That(result.Warnings, Has.Some.Contains("project 1 owner 999"));
        Assert.That(result.Warnings, Has.Some.Contains("task 60 owner 999"));
        Assert.That(_addedProject, Is.Not.Null);
        Assert.That(_addedProject!.OwnerId, Is.EqualTo(42));
        Assert.That(_addedPromise, Is.Not.Null);
        Assert.That(_addedPromise!.ProjectId, Is.EqualTo(100));
        Assert.That(_addedPromise.OwnerId, Is.EqualTo(7));
        Assert.That(_addedEpic!.ProductPromiseId, Is.EqualTo(110));
        Assert.That(_addedJourney!.EpicId, Is.EqualTo(120));
        Assert.That(_addedFlow!.JourneyId, Is.EqualTo(130));
        Assert.That(_addedMoment!.FlowId, Is.EqualTo(140));
        Assert.That(_addedMoment!.AssignedStrideId, Is.EqualTo(180));
        Assert.That(_addedMoment!.OriginalStrideId, Is.EqualTo(180));
        Assert.That(_addedTask!.MomentId, Is.EqualTo(150));
        Assert.That(_addedTask!.OwnerId, Is.EqualTo(42));
        Assert.That(_addedIteration!.ProjectId, Is.EqualTo(100));
        Assert.That(_addedStride!.IterationId, Is.EqualTo(170));
    }
}