using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using NUnit.Framework;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests
{
    public class UpdateMomentEstimateRequestTests
    {
        [Test]
        public void Validate_NullEstimate_IsAccepted()
        {
            var request = new UpdateMomentEstimateRequest { Estimate = null };
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
        public void Validate_OutOfRangeEstimate_IsRejected()
        {
            var request = new UpdateMomentEstimateRequest { Estimate = (Estimate)999 };
            var results = new List<ValidationResult>();

            var isValid = Validator.TryValidateObject(
                request,
                new ValidationContext(request),
                results,
                validateAllProperties: true);

            Assert.That(isValid, Is.False);
            Assert.That(results.Any(result => result.MemberNames.Contains(nameof(UpdateMomentEstimateRequest.Estimate))), Is.True);
        }
    }
}
