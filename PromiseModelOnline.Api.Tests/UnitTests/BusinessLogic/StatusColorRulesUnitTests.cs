using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="StatusColorRules"/> roll-up, normalization, and canonical mapping.</summary>
// Requirements: REQ_FUN_027
public class StatusColorRulesUnitTests
{
    [Test]
    public void REQ_FUN_027_RollUp_AllBlocked_ReturnsBlocked()
    {
        // Arrange (no setup needed)
        // Act
        var result = StatusColorRules.RollUp(new[] { StatusColorRules.Blocked, StatusColorRules.Blocked });
        // Assert
        Assert.That(result, Is.EqualTo(StatusColorRules.Blocked));
    }

    [Test]
    public void REQ_FUN_027_RollUp_MixedStatuses_ReturnsInProgress()
    {
        // Arrange (no setup needed)
        // Act
        var result = StatusColorRules.RollUp(new[] { StatusColorRules.Todo, StatusColorRules.Done });
        // Assert
        Assert.That(result, Is.EqualTo(StatusColorRules.InProgress));
    }

    [Test]
    public void REQ_FUN_027_Normalize_KnownSynonyms_ReturnsCanonicalValues()
    {
        // Arrange (no setup needed)
        // Act
        Assert.That(StatusColorRules.Normalize("Blocked"), Is.EqualTo(StatusColorRules.Blocked));
        Assert.That(StatusColorRules.Normalize("in-progress"), Is.EqualTo(StatusColorRules.InProgress));
        Assert.That(StatusColorRules.Normalize("Done"), Is.EqualTo(StatusColorRules.Done));
        // Assert
        Assert.That(StatusColorRules.Normalize("Todo"), Is.EqualTo(StatusColorRules.Todo));
    }

    [Test]
    public void Normalize_NullInput_ReturnsEmpty()
    {
        // Arrange (no setup needed)
        // Act
        var result = StatusColorRules.Normalize(null);
        // Assert
        Assert.That(result, Is.EqualTo(string.Empty));
    }

    [Test]
    public void RollUp_EmptyChildren_ReturnsTodo()
    {
        // Arrange (no setup needed)
        // Act
        var result = StatusColorRules.RollUp(Array.Empty<string>());
        // Assert
        Assert.That(result, Is.EqualTo(StatusColorRules.Todo));
    }

    [Test]
    public void RollUp_AllDone_ReturnsDone()
    {
        // Arrange (no setup needed)
        // Act
        var result = StatusColorRules.RollUp(new[] { StatusColorRules.Done, StatusColorRules.Done });
        // Assert
        Assert.That(result, Is.EqualTo(StatusColorRules.Done));
    }
}
