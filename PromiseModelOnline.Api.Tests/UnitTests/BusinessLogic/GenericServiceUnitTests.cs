using System;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="GenericService{T}"/> covering CRUD delegation and save orchestration.</summary>
public class GenericServiceUnitTests
{
    private Mock<IGenericRepository<Project>> _repoMock = null!;
    private GenericService<Project> _service = null!;

    [SetUp]
    public void SetUp()
    {
        _repoMock = new Mock<IGenericRepository<Project>>();
        _service = new GenericService<Project>(_repoMock.Object);
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAllAsync_DelegatesToRepository()
    {
        var projects = new[] { new Project { Id = 1 }, new Project { Id = 2 } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(projects);

        var result = await _service.GetAllAsync();

        Assert.That(result, Is.EqualTo(projects));
        _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_XXX_GetByIdAsync_ExistingId_ReturnsEntity()
    {
        var project = new Project { Id = 5 };
        _repoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(project);

        var result = await _service.GetByIdAsync(5);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(5));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _repoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Project?)null);

        var result = await _service.GetByIdAsync(999);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_AddAsync_CallsRepositoryAddAndSave()
    {
        var project = new Project { Name = "New" };

        await _service.AddAsync(project);

        _repoMock.Verify(r => r.AddAsync(project), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_XXX_AddAsync_SaveFailure_PropagatesException()
    {
        var project = new Project { Name = "Fail" };
        _repoMock.Setup(r => r.SaveChangesAsync()).ThrowsAsync(new InvalidOperationException("DB error"));

        var ex = Assert.ThrowsAsync<InvalidOperationException>(() => _service.AddAsync(project));
        Assert.That(ex!.Message, Does.Contain("DB error"));
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateAsync_CallsRepositoryUpdateAndSave()
    {
        var project = new Project { Id = 1, Name = "Updated" };

        await _service.UpdateAsync(project);

        _repoMock.Verify(r => r.Update(project), Times.Once);
        _repoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_ExistingId_ReturnsTrue()
    {
        _repoMock.Setup(r => r.DeleteByIdAsync(1)).ReturnsAsync(true);

        var result = await _service.DeleteByIdAsync(1);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.DeleteByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_NonExistingId_ReturnsFalse()
    {
        _repoMock.Setup(r => r.DeleteByIdAsync(999)).ReturnsAsync(false);

        var result = await _service.DeleteByIdAsync(999);

        Assert.That(result, Is.False);
    }
}
