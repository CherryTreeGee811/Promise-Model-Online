using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using NUnit.Framework;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests
{
    public class UpdateMomentTypeRequestTests
    {
        [Test]
        public void Validate_StoryType_IsAccepted()
        {
            var request = new UpdateMomentTypeRequest { NewType = MomentType.Story };
            var results = new List<ValidationResult>();

            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            Assert.That(isValid, Is.True);
            Assert.That(results, Is.Empty);
        }

        [Test]
        public void Validate_JobType_IsAccepted()
        {
            var request = new UpdateMomentTypeRequest { NewType = MomentType.Job };
            var results = new List<ValidationResult>();

            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            Assert.That(isValid, Is.True);
            Assert.That(results, Is.Empty);
        }

        [Test]
        public void Validate_OutOfRangeType_IsRejected()
        {
            var request = new UpdateMomentTypeRequest { NewType = (MomentType)999 };
            var results = new List<ValidationResult>();

            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            Assert.That(isValid, Is.False);
        }
    }
}
