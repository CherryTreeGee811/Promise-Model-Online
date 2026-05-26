using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PMO.Core.Models;

namespace PromiseModelOnline.Api.Tests;

public class ProjectImportValidationServiceUnitTests
{
    private ProjectImportValidationService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _service = new ProjectImportValidationService();
    }

    [Test]
    public async Task ValidateAsync_WithValidDocument_ReturnsDocument()
    {
        var document = new ProjectExportDocument
        {
            SchemaVersion = "1.0",
            Project = new ProjectExportProject
            {
                Id = 1,
                Name = "Project",
                ProductPromises =
                [
                    new ProjectExportPromise
                    {
                        Id = 10,
                        ProjectId = 1,
                        Statement = "Promise",
                        StatusColor = "green",
                        Epics =
                        [
                            new ProjectExportEpic
                            {
                                Id = 20,
                                ProductPromiseId = 10,
                                Statement = "Epic",
                                StatusColor = "yellow",
                                Journeys =
                                [
                                    new ProjectExportJourney
                                    {
                                        Id = 30,
                                        EpicId = 20,
                                        Statement = "Journey",
                                        StatusColor = "orange",
                                        Flows =
                                        [
                                            new ProjectExportFlow
                                            {
                                                Id = 40,
                                                JourneyId = 30,
                                                Statement = "Flow",
                                                StatusColor = "black",
                                                Moments =
                                                [
                                                    new ProjectExportMoment
                                                    {
                                                        Id = 50,
                                                        FlowId = 40,
                                                        Statement = "Moment",
                                                        Type = MomentType.Job,
                                                        Status = MomentStatus.Todo,
                                                        StatusColor = "red",
                                                        Tasks =
                                                        [
                                                            new ProjectExportMomentTask
                                                            {
                                                                Id = 60,
                                                                MomentId = 50,
                                                                Name = "Task",
                                                                Description = "Task"
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
                        Strides =
                        [
                            new ProjectExportStride
                            {
                                Id = 80,
                                IterationId = 70,
                                Name = "Stride",
                                StartDate = new System.DateTime(2026, 5, 1),
                                EndDate = new System.DateTime(2026, 5, 14),
                                DurationDays = 14,
                                IsActive = true,
                                MomentIds = [50]
                            }
                        ]
                    }
                ]
            }
        };

        await using var stream = CreateStream(document);

        var result = await _service.ValidateAsync(stream);

        Assert.That(result.IsValid, Is.True);
        Assert.That(result.Errors, Is.Empty);
        Assert.That(result.Warnings, Is.Empty);
        Assert.That(result.Document, Is.Not.Null);
        Assert.That(result.Document!.Project.ProductPromises.Single().Epics.Single().Journeys.Single().Flows.Single().Moments.Single().Tasks.Single().Id, Is.EqualTo(60));
    }

    [Test]
    public async Task ValidateAsync_WithMalformedJson_ReturnsError()
    {
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes("{ invalid json"));

        var result = await _service.ValidateAsync(stream);

        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Errors.Single(), Does.StartWith("Malformed JSON:"));
    }

    [Test]
    public async Task ValidateAsync_WithUnsupportedSchemaVersion_ReturnsError()
    {
        var document = new ProjectExportDocument
        {
            SchemaVersion = "2.0",
            Project = new ProjectExportProject
            {
                Id = 1,
                Name = "Project"
            }
        };

        await using var stream = CreateStream(document);

        var result = await _service.ValidateAsync(stream);

        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Errors, Has.Some.Contains("Unsupported schema version"));
    }

    [Test]
    public async Task ValidateAsync_WithBrokenHierarchy_ReturnsError()
    {
        var document = new ProjectExportDocument
        {
            SchemaVersion = "1.0",
            Project = new ProjectExportProject
            {
                Id = 1,
                Name = "Project",
                ProductPromises =
                [
                    new ProjectExportPromise
                    {
                        Id = 10,
                        ProjectId = 999,
                        Statement = "Promise",
                        Epics = []
                    }
                ]
            }
        };

        await using var stream = CreateStream(document);

        var result = await _service.ValidateAsync(stream);

        Assert.That(result.IsValid, Is.False);
        Assert.That(result.Errors, Has.Some.Contains("references project 999"));
    }

    private static MemoryStream CreateStream(ProjectExportDocument document)
    {
        var json = JsonSerializer.Serialize(document, new JsonSerializerOptions { WriteIndented = true });
        return new MemoryStream(Encoding.UTF8.GetBytes(json));
    }
}