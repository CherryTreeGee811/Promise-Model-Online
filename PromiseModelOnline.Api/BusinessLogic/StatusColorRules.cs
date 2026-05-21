using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Linq;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public static class StatusColorRules
    {
        public const string Todo = "red";
        public const string InProgress = "orange";
        public const string Blocked = "black";
        public const string Done = "green";

        public static string FromMomentStatus(MomentStatus status)
        {
            return status switch
            {
                MomentStatus.Done => Done,
                MomentStatus.InProgress => InProgress,
                MomentStatus.Blocked => Blocked,
                _ => Todo,
            };
        }

        public static string Normalize(string? statusColor)
        {
            var normalized = (statusColor ?? string.Empty).Trim().ToLowerInvariant();

            return normalized switch
            {
                "green" or "done" => Done,
                "orange" or "yellow" or "amber" or "inprogress" or "in-progress" => InProgress,
                "black" or "blocked" => Blocked,
                "red" or "todo" => Todo,
                _ => string.Empty,
            };
        }

        public static string RollUp(IEnumerable<string?> childStatusColors)
        {
            var normalized = childStatusColors
                .Select(Normalize)
                .Where(value => !string.IsNullOrEmpty(value))
                .ToList();

            if (normalized.Count == 0)
                return Todo;

            if (normalized.All(value => value == Blocked))
                return Blocked;

            if (normalized.All(value => value == Done))
                return Done;

            if (normalized.All(value => value == InProgress))
                return InProgress;

            if (normalized.All(value => value == Todo))
                return Todo;

            return InProgress;
        }
    }
}