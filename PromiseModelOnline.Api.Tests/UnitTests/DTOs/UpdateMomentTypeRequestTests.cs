using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using NUnit.Framework;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests
{
    /// <summary>Unit tests for <see cref="UpdateMomentTypeRequest"/> validation.</summary>
    // Requirements: REQ_FUN_008
    public class UpdateMomentTypeRequestTests
    {
        [Test]
        public void REQ_FUN_008_Validate_StoryType_IsAccepted()
        {
            // Arrange
            var request = new UpdateMomentTypeRequest { NewType = MomentType.Story };
            var results = new List<ValidationResult>();

            // Act
            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            // Assert
            Assert.That(isValid, Is.True);
            Assert.That(results, Is.Empty);
        }

        [Test]
        public void REQ_FUN_008_Validate_JobType_IsAccepted()
        {
            // Arrange
            var request = new UpdateMomentTypeRequest { NewType = MomentType.Job };
            var results = new List<ValidationResult>();

            // Act
            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            // Assert
            Assert.That(isValid, Is.True);
            Assert.That(results, Is.Empty);
        }

        [Test]
        public void REQ_FUN_008_Validate_OutOfRangeType_IsRejected()
        {
            // Arrange
            var request = new UpdateMomentTypeRequest { NewType = (MomentType)999 };
            var results = new List<ValidationResult>();

            // Act
            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            // Assert
            Assert.That(isValid, Is.False);
        }
    }
}
