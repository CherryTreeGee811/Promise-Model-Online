using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using NUnit.Framework;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests
{
    /// <summary>Unit tests for <see cref="UpdateMomentEstimateRequest"/> validation.</summary>
    // Requirements: REQ_FUN_029
    public class UpdateMomentEstimateRequestTests
    {
        [Test]
        public void REQ_FUN_029_Validate_NullEstimate_IsAccepted()
        {
            // Arrange
            var request = new UpdateMomentEstimateRequest { Estimate = null };
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
        public void REQ_FUN_029_Validate_OutOfRangeEstimate_IsRejected()
        {
            // Arrange
            var request = new UpdateMomentEstimateRequest { Estimate = (Estimate)999 };
            var results = new List<ValidationResult>();

            // Act
            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            // Assert
            Assert.That(isValid, Is.False);
            Assert.That(results.Any(result => result.MemberNames.Contains(nameof(UpdateMomentEstimateRequest.Estimate))), Is.True);
        }
    }
}
