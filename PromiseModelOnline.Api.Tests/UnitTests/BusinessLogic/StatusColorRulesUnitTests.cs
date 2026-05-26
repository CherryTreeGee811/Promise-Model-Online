using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class StatusColorRulesUnitTests
    {
        [Test]
        public void RollUp_AllBlocked_ReturnsBlocked()
        {
            var result = StatusColorRules.RollUp(new[] { StatusColorRules.Blocked, StatusColorRules.Blocked });

            Assert.That(result, Is.EqualTo(StatusColorRules.Blocked));
        }

        [Test]
        public void RollUp_MixedStatuses_ReturnsInProgress()
        {
            var result = StatusColorRules.RollUp(new[] { StatusColorRules.Todo, StatusColorRules.Done });

            Assert.That(result, Is.EqualTo(StatusColorRules.InProgress));
        }

        [Test]
        public void Normalize_KnownSynonyms_ReturnsCanonicalValues()
        {
            Assert.That(StatusColorRules.Normalize("Blocked"), Is.EqualTo(StatusColorRules.Blocked));
            Assert.That(StatusColorRules.Normalize("in-progress"), Is.EqualTo(StatusColorRules.InProgress));
            Assert.That(StatusColorRules.Normalize("Done"), Is.EqualTo(StatusColorRules.Done));
            Assert.That(StatusColorRules.Normalize("Todo"), Is.EqualTo(StatusColorRules.Todo));
        }
    }
}